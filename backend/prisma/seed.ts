import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // Clean the database
  await prisma.refreshToken.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@blog.com',
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const author1 = await prisma.user.create({
    data: {
      email: 'author1@blog.com',
      username: 'author1',
      passwordHash,
      role: 'USER',
    },
  });

  const reader1 = await prisma.user.create({
    data: {
      email: 'reader1@blog.com',
      username: 'reader1',
      passwordHash,
      role: 'USER',
    },
  });

  console.log('Users created successfully.');

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'react' } }),
    prisma.tag.create({ data: { name: 'typescript' } }),
    prisma.tag.create({ data: { name: 'node' } }),
    prisma.tag.create({ data: { name: 'database' } }),
    prisma.tag.create({ data: { name: 'security' } }),
  ]);

  console.log('Tags created successfully.');

  // Create Posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Architecting Secure API Endpoints with Node & TypeScript',
      slug: 'architecting-secure-api-endpoints-with-node-typescript',
      content: `In this post, we discuss the key facets of secure API architecture in a Node.js ecosystem. 
      
## 1. Authentication and Authorization
Always use HTTPS and secure token storage mechanisms. A popular choice is using short-lived JWT access tokens and database-backed refresh tokens with automatic token rotation.

## 2. Input Validation
Validate every input to mitigate SQL injections and logical failures. Use schemas with libraries like Zod or Joi to enforce types and contents.

\`\`\`typescript
import { z } from 'zod';
const userSchema = z.object({
  email: z.string().email(),
});
\`\`\`

## 3. Rate Limiting
Prevent denial of service (DoS) and brute force login attempts using middleware like express-rate-limit. Let me know in the comments if you have any questions!`,
      excerpt: 'Learn the core principles of secure API architecture, covering token rotation, rate limiting, and input validation.',
      coverImage: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: admin.id,
      tags: {
        connect: [{ id: tags[1].id }, { id: tags[2].id }, { id: tags[4].id }], // typescript, node, security
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Relational Data Modelling: A Deep Dive into PostgreSQL and Prisma',
      slug: 'relational-data-modelling-a-deep-dive-into-postgresql-and-prisma',
      content: `Designing a scalable relational database schema is vital for complex entities like hierarchical comments.
      
### Why PostgreSQL?
Postgres offers excellent performance, ACID compliance, and robust querying features like recursive common table expressions (CTEs).

### Prisma as an ORM
Prisma auto-generates migrations and guarantees type safety from database level up to the frontend application. Let's see how comments are self-referenced:

\`\`\`prisma
model Comment {
  id       String    @id @default(uuid())
  parentId String?
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies  Comment[] @relation("CommentReplies")
}
\`\`\`
This makes fetching tree comments much easier!`,
      excerpt: 'Explore PostgreSQL relationships, self-referencing comments mapping, and Prisma ORM configuration.',
      coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[1].id }, { id: tags[3].id }], // typescript, database
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'An In-Progress Draft on Web Performance Optimization',
      slug: 'an-in-progress-draft-on-web-performance-optimization',
      content: 'This draft will cover critical rendering paths, code splitting, lazy loading, and asset CDNs.',
      excerpt: 'Initial thoughts on boosting load times and core web vitals.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop',
      status: 'DRAFT',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[0].id }], // react
      },
    },
  });

  console.log('Posts created successfully.');

  // Create Nested Comments
  const rootComment1 = await prisma.comment.create({
    data: {
      content: 'This is a fantastic architecture guide! Thanks for sharing.',
      postId: post1.id,
      authorId: reader1.id,
    },
  });

  const reply1_1 = await prisma.comment.create({
    data: {
      content: 'I agree, especially the token rotation part!',
      postId: post1.id,
      authorId: author1.id,
      parentId: rootComment1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Yes! Token rotation is a must for secure apps.',
      postId: post1.id,
      authorId: reader1.id,
      parentId: reply1_1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Nice article. What about CSRF protection?',
      postId: post1.id,
      authorId: admin.id,
      parentId: rootComment1.id,
    },
  });

  const rootComment2 = await prisma.comment.create({
    data: {
      content: 'Is bcrypt really better than argon2?',
      postId: post1.id,
      authorId: reader1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Argon2 is newer and more secure against GPU attacks, but bcrypt is very reliable.',
      postId: post1.id,
      authorId: admin.id,
      parentId: rootComment2.id,
    },
  });

  console.log('Comments seeded successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

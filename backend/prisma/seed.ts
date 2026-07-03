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
    prisma.tag.create({ data: { name: 'github' } }),
    prisma.tag.create({ data: { name: 'linkedin' } }),
    prisma.tag.create({ data: { name: 'portfolio' } }),
    prisma.tag.create({ data: { name: 'research' } }),
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

  const post4 = await prisma.post.create({
    data: {
      title: 'Mastering GitHub: Dynamic Workflows & Repository Best Practices',
      slug: 'mastering-github-dynamic-workflows-repository-best-practices',
      content: `GitHub is more than just a repository hosting service; it is the central nervous system of modern software development collaboration. 

## 1. Structured Branching Strategies
To maintain stability, teams must employ strict branching strategies. **Git Flow** and **GitHub Flow** are the two industry standards. For web-based CD pipelines, GitHub Flow (short-lived feature branches merging directly into \`main\`) is highly recommended.

## 2. Automating with GitHub Actions
Automate your testing, linting, and deployments using GitHub Actions. A basic workflow configures tests to run automatically on every Pull Request:

\`\`\`yaml
name: CI Suite
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
\`\`\`

## 3. GitHub Profile Optimization
Your GitHub profile is your digital resume. Enhance it by:
- Creating a personalized \`README.md\` (by creating a repository matching your username).
- Pinning your best repositories with clear documentation.
- Keeping a consistent contribution graph to showcase active development.

Check out my GitHub at [https://github.com/jayanthlanka22-art](https://github.com/jayanthlanka22-art) for reference and source code!`,
      excerpt: 'Optimize your version control workflows and elevate your GitHub profile into a premium engineering showcase.',
      coverImage: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[5].id }, { id: tags[4].id }], // github, security
      },
    },
  });

  const post5 = await prisma.post.create({
    data: {
      title: 'LinkedIn for Engineers: Building a Powerful Personal Brand',
      slug: 'linkedin-for-engineers-building-a-powerful-personal-brand',
      content: `LinkedIn is the premier professional platform. For software engineers, optimizing your presence can unlock hidden job opportunities, partnerships, and industry connections.

## 1. Write an Impactful Headline
Do not just list "Software Engineer at X". Use a value-focused headline. For example: *Full-Stack Engineer | React & Node.js Specialist | Architecting Scalable & Secure Web Systems*.

## 2. Showcase Projects & Achievements
Use the "Featured" section to showcase:
- Link to your personal portfolio website.
- Your most impressive GitHub open-source contributions.
- Technical articles or blog posts you have written.

## 3. Engage & Share Insights
Write short posts highlighting lessons learned from debugging, architectural decisions you made, or tutorials on new technologies. Authenticity builds a highly engaged audience.

Connect with me and see updates on LinkedIn at [https://www.linkedin.com/in/jayanthlanka](https://www.linkedin.com/in/jayanthlanka)!`,
      excerpt: 'Transform your LinkedIn profile from a static resume into an active portal that attracts recruiters and collaborators.',
      coverImage: 'https://images.unsplash.com/photo-1579869847514-7c1a19d2d2ad?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[6].id }], // linkedin
      },
    },
  });

  const post6 = await prisma.post.create({
    data: {
      title: 'Building a High-Performance Personal Developer Portfolio Website',
      slug: 'building-a-high-performance-personal-developer-portfolio-website',
      content: `A developer portfolio is your ultimate sandbox. It is where you demonstrate your frontend engineering capabilities, design aesthetics, and performance optimization skills.

## 1. Tech Stack Selection
For a modern portfolio, prioritize load speed and SEO:
- **Framework**: React (Next.js/Vite) or Astro for static site generation.
- **Styling**: Tailwind CSS or CSS Modules for clean layouts.
- **Animations**: Framer Motion for smooth, hardware-accelerated micro-interactions.

## 2. Design Aesthetics
Adhere to the core principles of high-quality UI design:
- Sleek dark modes with curated accent colors (avoid plain primary colors).
- Clean typography and structural hierarchy.
- Subtle background patterns (like grid or dot meshes) and glassmorphism cards.

## 3. Key Pages to Include
1. **Hero Section**: A bold statement of who you are and what you build.
2. **Projects**: Cards showing project screenshots, tech tags, and direct GitHub links.
3. **Experience/Skills**: A visual representation of your technical timeline.
4. **Blog / Contact**: Ways to read your thoughts and reach out to you.

Check out my portfolio in action to see these principles applied: [http://localhost:5173/](http://localhost:5173/) (or check out my portfolio folder in the workspace)!`,
      excerpt: 'Discover how to design and build a stunning, fast, and SEO-optimized portfolio website that stands out.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[7].id }, { id: tags[0].id }], // portfolio, react
      },
    },
  });

  const post7 = await prisma.post.create({
    data: {
      title: 'Research: The Impact of Agentic AI on Modern Software Engineering',
      slug: 'research-the-impact-of-agentic-ai-on-modern-software-engineering',
      content: `The paradigm of software development is undergoing a massive shift. The transition from *copilot autocomplete* tools to autonomous, agentic coding assistants (like Gemini 3.5 Flash and others) is changing how software is conceptualized, built, and tested.

## 1. What makes an AI "Agentic"?
Unlike traditional autocomplete, agentic AIs are goal-oriented. They can:
- Formulate implementation plans.
- Read, write, and refactor code across multiple files.
- Execute terminal commands and verify results (tests, linters).
- Debug issues by inspecting browser page state and error logs.

## 2. Key Architecture of Coding Agents
Modern coding agents rely on the **Model-Context-Protocol (MCP)** to interact with tools.

\`\`\`
[ Large Language Model ] <---> [ Orchestrator Agent ] <---> [ File / Terminal / Browser Tools ]
\`\`\`

By separating the cognitive model from direct tool execution and adding safety verification sandboxes, agents can perform complex tasks autonomously.

## 3. Empirical Research Findings
Recent benchmarks show that agentic workflows:
- Reduce bugs in refactoring by up to **40%** due to closed-loop validation (automatically running test suites after editing code).
- Increase developer productivity, freeing up time to focus on high-level architecture rather than repetitive boilerplate code.
- Demand new testing paradigms: writing comprehensive unit and integration tests is now more critical than ever, since agents rely on them to confirm correctness.`,
      excerpt: 'Explore the architectural shifts, empirical findings, and future outlook of agent-based software engineering.',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: admin.id,
      tags: {
        connect: [{ id: tags[8].id }, { id: tags[1].id }], // research, typescript
      },
    },
  });

  const post8 = await prisma.post.create({
    data: {
      title: 'Case Study: Designing and Scaling the ShopHub E-Commerce Architecture',
      slug: 'case-study-designing-and-scaling-the-shophub-e-commerce-architecture',
      content: `In modern full-stack web applications, designing a scalable e-commerce infrastructure is one of the most comprehensive challenges. This case study details the development of **ShopHub**, an e-commerce platform built with React, Node.js, Express, and MongoDB.

## 1. The Core Problem
E-commerce websites must handle frequent read queries (browsing catalogs, applying filters) alongside high-integrity write queries (creating orders, updating stock levels). Inefficient API routes and naive database architectures lead to slow catalog load times and race conditions during checkout.

## 2. Solution: REST API and Cart Caching
To address this, we separated catalog queries from order processing:
- Catalog endpoints utilize MongoDB indexes on search attributes (category, price, tags) to achieve sub-50ms reads.
- We implemented global state management on the React frontend to cache catalog listings, avoiding redundant API calls when traversing back and forth.
- The shopping cart is managed locally on the client and validated server-side during checkout to ensure correct prices and stock levels.

## 3. Dynamic Admin CMS
ShopHub features an integrated admin CMS that enables site owners to:
- Dynamically upload and modify product listings.
- Monitor order statuses in real-time.
- Categorize catalog items to enable instant client-side filtering.

Find the source code for ShopHub on my GitHub: [https://github.com/jayanthlanka22-art/shophub](https://github.com/jayanthlanka22-art/shophub)`,
      excerpt: 'Read how ShopHub utilizes a robust REST API, React global state, and optimized MongoDB indexing to deliver a fast e-commerce experience.',
      coverImage: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[2].id }, { id: tags[3].id }], // react, node, database
      },
    },
  });

  const post9 = await prisma.post.create({
    data: {
      title: 'Architecting Resilient Portfolios: Building a Database-Less Offline Fallback Mode',
      slug: 'architecting-resilient-portfolios-building-a-database-less-offline-fallback-mode',
      content: `A developer portfolio is your personal digital headquarters. While standard dynamic portfolios rely on active database connections, they crash or render blank pages if the database goes offline. For **Digital Headquarters & Portfolio**, I set out to solve this single point of failure.

## 1. Resilient Backend Middleware
Rather than letting the Express server return a 500 status when MongoDB is unreachable, we engineered a connection check middleware.

\`\`\`typescript
app.use(async (req, res, next) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    // Switch to database-less fallback mode
    req.dbFallback = true;
  }
  next();
});
\`\`\`

## 2. Serving Mock Structures
When the fallback flag is active, our API controllers intercept the request and return local JSON mock structures representing the project catalog and resume details.
On the client, glassmorphism cards and smooth Framer Motion transitions render the fallback data seamlessly.

## 3. Performance Impact
This architecture guarantees:
- **100% Availability**: The portfolio never displays a blank error page.
- **Sub-10ms Route Response**: Fallback mock reads bypass network latency entirely.

Explore the portfolio codebase on GitHub: [https://github.com/jayanthlanka22-art/portfolio](https://github.com/jayanthlanka22-art/portfolio)`,
      excerpt: 'Learn how to build a resilient web portfolio featuring a custom connection check middleware that falls back to mock data when MongoDB is offline.',
      coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[7].id }, { id: tags[1].id }, { id: tags[4].id }], // portfolio, typescript, security
      },
    },
  });

  const post10 = await prisma.post.create({
    data: {
      title: 'Solving Concurrency: Multi-Threaded Room Reservation with Relational Transaction Isolation',
      slug: 'solving-concurrency-multi-threaded-room-reservation-with-relational-transaction-isolation',
      content: `In relational booking applications, the double-booking problem is a critical bug. When two desk administrators attempt to book the same hotel room concurrently, race conditions can corrupt the reservation ledger.

## 1. Concurrency Control in Java
In the **Hotel Reservation System**, we solved this by combining Java multi-threading principles with relational SQL configurations. We implemented synchronized booking service modules and handled database statements within transaction boundaries.

## 2. SQL Transaction Isolation Levels
To prevent "dirty reads" and "phantom bookings", we configured the JDBC connection to run at the **SERIALIZABLE** transaction isolation level:

\`\`\`java
connection.setAutoCommit(false);
connection.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
// Execute queries...
connection.commit();
\`\`\`

This locks the room status records during the checkout calculation phase, forcing competing requests to queue sequentially.

## 3. Billing and Invoice Generation
The system calculates billing figures, incorporates room tax adjustments, and prints invoice records dynamically upon guest checkout.

View the Java project repository on GitHub: [https://github.com/jayanthlanka22-art/hotel-reservation-system](https://github.com/jayanthlanka22-art/hotel-reservation-system)`,
      excerpt: 'A technical analysis of solving booking race conditions in a Java Desktop Reservation app using JDBC and serializable transactions.',
      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[3].id }], // database
      },
    },
  });

  const post11 = await prisma.post.create({
    data: {
      title: 'Building a Sandboxed Stock Simulation Engine Using OOP Principles in Java',
      slug: 'building-a-sandboxed-stock-simulation-engine-using-oop-principles-in-java',
      content: `Learning to trade stocks carries high financial risk. To help beginners practice, I built a sandboxed **Stock Trading Platform** simulation using object-oriented programming (OOP) principles in Java.

## 1. Object-Oriented Modeling of Financial Markets
The engine breaks down stock trading into distinct entities:
- \`Stock\`: Encapsulates price ticks, daily highs/lows, and market symbols.
- \`Portfolio\`: Tracks owned shares, average buy price, and remaining cash balance.
- \`TradeEngine\`: Processes market buy/sell orders and alters user portfolio cash.

## 2. Simulating Price Fluctuations
A worker thread updates stock prices at regular intervals using a random-walk algorithm, modeling realistic market ticks:

\`\`\`java
public double calculateNextPrice(double currentPrice) {
    double changePercent = (random.nextDouble() - 0.5) * volatility;
    return currentPrice * (1.0 + changePercent);
}
\`\`\`

## 3. Sandboxed Trade Ledger
The platform records every transaction in a thread-safe ledger, preventing negative portfolio balances and calculating overall profit/loss stats in real-time.

Inspect the simulation source code on GitHub: [https://github.com/jayanthlanka22-art/Stock_Trading_Platform](https://github.com/jayanthlanka22-art/Stock_Trading_Platform)`,
      excerpt: 'Read how OOP patterns and price simulation threads were combined to build a risk-free desktop stock trading sandboxed engine.',
      coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[1].id }], // typescript
      },
    },
  });

  const post12 = await prisma.post.create({
    data: {
      title: 'Data Structures and Algorithms: Designing a Student Grade Tracker for Educators',
      slug: 'data-structures-and-algorithms-designing-a-student-grade-tracker-for-educators',
      content: `Manually calculating grade averages and distributions takes significant time. The **Student Grade Tracker** is a statistical Java tool designed to parse, compute, and visualize academic performance records.

## 1. Algorithmic Data Processing
The program loads student grades into an optimized list and applies sorting algorithms (like Quicksort) to arrange scores. This makes retrieving the top-performing students an $O(1)$ lookup after sorting.

## 2. Statistical Analysis
The utility calculates critical classroom metrics:
- **Mean Score**: Sum of all scores divided by class count.
- **Median**: The middle score, providing a distortion-free view of performance.
- **Grade Distribution**: Standard frequency binning to plot academic curves.

## 3. Plotting Grade Curves
By grouping grade frequencies into brackets, the system displays ASCII or Swing grade frequency histograms, giving educators a direct view of class performance.

Check out the student grade utility code on GitHub: [https://github.com/jayanthlanka22-art/Student_Grade_Tracker](https://github.com/jayanthlanka22-art/Student_Grade_Tracker)`,
      excerpt: 'Explore the sorting algorithms and statistical frequency calculations used to build a grade tracker utility for teachers.',
      coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: author1.id,
      tags: {
        connect: [{ id: tags[1].id }], // typescript
      },
    },
  });

  const post13 = await prisma.post.create({
    data: {
      title: 'Research: Comparing PostgreSQL and SQLite in High-Read Concurrent Environments',
      slug: 'research-comparing-postgresql-and-sqlite-in-high-read-concurrent-environments',
      content: `When building web platforms, database selection dictates overall application scalability. This research paper evaluates the performance profiles of **PostgreSQL** and **SQLite** under concurrent workloads.

## 1. Concurrency Paradigms
- **SQLite**: Implements database-level locking. Under WAL (Write-Ahead Log) mode, SQLite supports concurrent readers, but only a single writer can edit database records at a time.
- **PostgreSQL**: Implements Multi-Version Concurrency Control (MVCC). MVCC allows locks at the row level, allowing high-concurrency read-write actions to execute simultaneously.

## 2. Throughput Benchmarks
Under high-read workloads (95% read, 5% write):
- SQLite performs exceptionally well in single-server configurations due to avoiding network roundtrips (routes access local file storage directly). Response latency averages **2-5ms**.
- PostgreSQL has slight network overhead, but scales horizontally and maintains throughput as simultaneous requests grow past 500.

## 3. Recommendations for Engineering Teams
For small-to-medium platforms or local staging environments, SQLite under WAL mode is fully sufficient and simplifies maintenance. For large-scale multi-instance cloud deployments, PostgreSQL with MVCC is essential.`,
      excerpt: 'An empirical comparison of database throughput, lock behaviors, and network latency under concurrent high-read conditions.',
      coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: admin.id,
      tags: {
        connect: [{ id: tags[8].id }, { id: tags[3].id }], // research, database
      },
    },
  });

  const post14 = await prisma.post.create({
    data: {
      title: 'Research: Micro-Frontends & Dynamic Custom Tag Systems in Web Frameworks',
      slug: 'research-micro-frontends-dynamic-custom-tag-systems-in-web-frameworks',
      content: `As web architectures evolve, monolithic SPAs are being replaced by decoupled micro-frontends. This research explores how dynamic tag systems enable runtime configuration injection on the web client.

## 1. Decoupled Deployments
Micro-frontends allow independent engineering groups to deploy separate frontend features (like comments, headers, or dashboards) without rebuilding the parent dashboard. This is usually implemented via Module Federation.

## 2. Dynamic Tag Injection
A dynamic tag system registers custom components dynamically at runtime. For example, using web components or dynamic React injection:

\`\`\`typescript
const loadMicroFrontend = (containerId: string, url: string) => {
  const script = document.createElement('script');
  script.src = url;
  script.onload = () => {
    // Initialize component inside container
  };
  document.head.appendChild(script);
};
\`\`\`

## 3. Technical Challenges
Key difficulties include CSS isolation (solved via Shadow DOM) and global state synchronization. Research shows that lightweight event buses (using custom browser events) provide the cleanest decoupling.`,
      excerpt: 'Explore module federation, dynamic scripts, and custom web components in micro-frontend architectures.',
      coverImage: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600&auto=format&fit=crop',
      status: 'PUBLISHED',
      authorId: admin.id,
      tags: {
        connect: [{ id: tags[8].id }, { id: tags[0].id }], // research, react
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

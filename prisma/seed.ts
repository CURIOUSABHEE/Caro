import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Explicitly instantiate database connection for seed runner
async function main() {
  console.log("Seeding database...");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("WARNING: DATABASE_URL is not set. Skipping seed.");
    return;
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const projectCount = await prisma.project.count();
    if (projectCount === 0) {
      await prisma.project.create({
        data: {
          title: "Test Blog Project",
          url: "https://example.com/test-blog",
          originalText: "This is a test blog post to seed the database.",
          themeName: "monochrome",
          username: "@testuser",
          slides: {
            create: [
              {
                slideType: "COVER",
                title: "Welcome to Carousel Generator",
                body: "Turn any blog URL into stunning slides in minutes.",
                order: 0,
              },
              {
                slideType: "CONTENT",
                title: "Step 1: Extract",
                body: "Paste your blog link and clean the text.",
                order: 1,
              },
              {
                slideType: "CLOSING",
                title: "Start Designing",
                body: "Select a theme and export your ZIP.",
                order: 2,
              },
            ],
          },
        },
      });
      console.log("Database seeded successfully!");
    } else {
      console.log("Database already has records, skipping seed.");
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  } finally {
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

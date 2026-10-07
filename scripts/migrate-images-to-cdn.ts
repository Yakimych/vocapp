// Copies images of existing words from their original URLs to Cloudinary.
// Usage: yarn migrate:images [--dry-run]
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const main = async () => {
  // Imported after loading env, since the Cloudinary SDK reads CLOUDINARY_URL on import
  const { PrismaClient } = await import("@prisma/client");
  const { v2: cloudinary } = await import("cloudinary");
  const { isStoredImageUrl, storeImage } = await import(
    "../src/server/imageStorage"
  );

  const isDryRun = process.argv.includes("--dry-run");
  const cloudName = cloudinary.config().cloud_name;
  if (!cloudName) {
    throw new Error(
      process.env.CLOUDINARY_URL === ""
        ? "CLOUDINARY_URL is empty. Files pulled with `vercel env pull` contain sensitive variables as empty values, which hide the ones in .env.local - delete that line from the pulled file"
        : "CLOUDINARY_URL is not set"
    );
  }

  const prisma = new PrismaClient();
  try {
    const vocValues = await prisma.vocValue.findMany({
      select: { id: true, value: true, imageUrl: true },
    });
    const toMigrate = vocValues.filter(
      (v): v is typeof v & { imageUrl: string } =>
        !!v.imageUrl && !isStoredImageUrl(v.imageUrl, cloudName)
    );

    console.log(
      `${vocValues.length} words, ${toMigrate.length} with images to migrate${
        isDryRun ? " (dry run)" : ""
      }`
    );

    const failures: Array<{ id: string; value: string; error: string }> = [];
    for (const [index, { id, value, imageUrl }] of toMigrate.entries()) {
      const prefix = `[${index + 1}/${toMigrate.length}] ${value}`;
      if (isDryRun) {
        console.log(`${prefix}: ${imageUrl}`);
        continue;
      }

      try {
        const storedImageUrl = await storeImage(imageUrl);
        await prisma.vocValue.update({
          where: { id },
          data: { imageUrl: storedImageUrl },
        });
        console.log(`${prefix}: ${imageUrl} -> ${storedImageUrl}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ id, value, error: message });
        console.log(`${prefix}: FAILED ${imageUrl}`);
      }
    }

    if (!isDryRun) {
      console.log(
        `\nMigrated ${toMigrate.length - failures.length}, failed ${
          failures.length
        }, already stored or without image ${
          vocValues.length - toMigrate.length
        }`
      );
    }
    if (failures.length > 0) {
      console.log(
        "\nFailed words (left unchanged, fix them via the Edit page):"
      );
      failures.forEach(({ id, value, error }) =>
        console.log(`  ${id} / ${value} / ${error}`)
      );
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

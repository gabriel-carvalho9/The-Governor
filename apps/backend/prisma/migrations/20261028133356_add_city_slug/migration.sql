/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `City` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `City` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `city` ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `City_slug_key` ON `City`(`slug`);

-- AddForeignKey
ALTER TABLE `SimulationSave` ADD CONSTRAINT `SimulationSave_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Made the column `verificationCode` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `verificationCode` VARCHAR(191) NOT NULL;

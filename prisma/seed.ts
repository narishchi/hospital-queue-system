
import "dotenv/config";
import prisma from "../app/lib/prisma";

const departments = [
  { name: "อายุรกรรม", code: "MED" },
  { name: "ทันตกรรม", code: "DEN" },
  { name: "จิตเวช", code: "PSY" },
];

async function main() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: {
        name: department.name,
        isActive: true,
      },
      create: {
        ...department,
        isActive: true,
      },
    });
  }

  console.log("เพิ่มข้อมูลแผนกเรียบร้อยแล้ว");
}

main()
  .catch((error) => {
    console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

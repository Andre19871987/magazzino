import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
    try {
        const users = await prisma.user.findMany({
            where: {
                name: 'Mario Rossi'
            }
        });

        console.log(users);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

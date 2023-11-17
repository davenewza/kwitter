import { Clean, models } from '@teamkeel/sdk';
export default Clean(async (ctx, inputs) => {

    const accounts = await models.identity.findMany();

    accounts.forEach(async function(acc) {
        await  models.identity.delete({ id: acc.id });
        console.log(acc.id);
    });

    return {count: accounts.length };
})
import { Clean, models } from '@teamkeel/sdk';
export default Clean(async (ctx, inputs) => {

    const identities = await models.identity.findMany();

    for (const identity of identities) {
        await  models.identity.delete({ id: identity.id });
    };

    return {count: identities.length };
})
import { Seed, models, Account } from '@teamkeel/sdk';

export default Seed(async (ctx, inputs) => {
    
    const myaccount = await models.account.findOne({ id: inputs.follower });

    var accounts:Account[] = [];

    for (let i = 0; i < inputs.users; i++) {
        const account = await models.account.create({ username: "@user" + i, email: "user" + i + " @keel.so" });
        await models.follow.create({ followerId: myaccount!.id, followeeId: account.id });
        accounts.push(account);
    }

    // await accounts.forEach(async function(follower) {
    //     await accounts.forEach(async function(followee) {
    //         if (followee.id != follower.id) {
    //             await models.follow.create({ followerId: follower.id, followeeId: followee.id });
    //         }
    //     });
    // });


    for (let account of accounts) {
        for (let i = 0; i < inputs.tweets; i++) {
             await models.tweet.create({ accountId: account.id, content: "My interesting bit for today! Please like and subscribe! <3 " + i });
        }
    }

    const tweetCount = await models.tweet.findMany();
    
    return { accounts: accounts.length, tweets: tweetCount.length, myAccount: myaccount };
});
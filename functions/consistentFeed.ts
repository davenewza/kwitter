import { ConsistentFeed, Feed, models } from '@teamkeel/sdk';

export default ConsistentFeed(async (_, inputs) => {
    const follows = await models.follow.findMany({ where: { followerId: inputs.id }});

    const feed:Feed[] = [];

    for (const follow of follows) {
        const followee = await models.account.findOne({ id: follow.followeeId });
        const tweets = await models.tweet.findMany({ where: { accountId: followee!.id }});



        for (const t of tweets) {
            feed.push( { id: "1", username: followee!.username, accountId: inputs.id, content: t!.content, createdAt: t.createdAt, updatedAt: t.createdAt, tweetedAt: t.createdAt });
        }

    }

    feed.sort((a, b) =>  b.createdAt.getTime() - a.createdAt.getTime() );
    

    return { feed: feed.slice(0, 25) };
})
import { PropogateTweet, models } from '@teamkeel/sdk';

export default PropogateTweet(async (ctx, event) => {
   // Add to each followers feed
   const follows = await models.follow.findMany({ where: { followeeId: event.target.data.accountId }});
   const followee = await models.account.findOne( {id:event.target.data.accountId });

   for (const follow of follows)  {
      await models.feed.create({ accountId: follow.followerId, username: followee!.username, content: event.target.data.content, tweetedAt: event.target.data.createdAt });
   }
});
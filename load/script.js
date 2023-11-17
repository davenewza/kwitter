import http from "k6/http";
import { sleep, check, fail } from "k6";
import { users } from "./users.js";
import { SharedArray } from "k6/data";
import { scenario } from "k6/execution";
import { vu } from "k6/execution";

const population = 2500;
const concurrentUsers = 25;
const actionDelay = 1; // seconds between actions

export const options = {
  ext: {
    loadimpact: {
      projectID: 3669966,
      distribution: {
        //'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 34 },
        "amazon:gb:london": { loadZone: "amazon:gb:london", percent: 100 },
        //'amazon:au:sydney': { loadZone: 'amazon:au:sydney', percent: 33 },
      },
    },
  },
  scenarios: {
    browsingKwitter: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: concurrentUsers },
        // { duration: "3s", target: 5 },
        { duration: "30s", target: concurrentUsers },
        { duration: "3s", target: 0 },
      ],
      // stages: [
      //     { duration: '10s', target: 30 },
      //     { duration: '10s', target: 30 },
      //     { duration: '10s', target: 0 },
      // ],
      gracefulRampDown: "10s",
    },
    //iterations: 200,
  },
  // stages: [
  //     { duration: '5s', target: 5 },
  //     { duration: '10s', target: 10 },
  //     { duration: '5s', target: 0 },
  //   ],
};

const url =
  "https://load-testing--kwitter-NhCPTR.staging.keelapps.xyz/api/json";

const usernames = new SharedArray("some name", function () {
  if (users.length < population) {
    throw new Error("not enough users");
  }
  return users.slice(0, population);
});

export function setup() {
  const feed = http.post(url + "/clean", JSON.stringify({}), {
    headers: {
      "Content-Type": "application/json",
    },
  });
  check(feed, {
    "clean is status 200": (r) => r.status === 200,
  });
  console.log("cleaned out " + feed.json().count);
  return;
}

export default function () {
  const username = usernames[vu.idInTest - 1];

  // 1. Signs in
  const auth = http.post(
    url + "/authenticate",
    JSON.stringify({
      createIfNotExists: true,
      emailPassword: {
        email: username + "@keel.so",
        password: "1234",
      },
    }),
    {
      tags: { name: "authenticate" },
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  check(auth, {
    "authenticate is status 200": (r) => r.status === 200,
  });

  if (auth.status != 200) {
    console.log(auth.body);
    fail(auth.body);
  }

  const token = auth.json().token;

  sleep(actionDelay);
  const account = http.post(url + "/getAccount", JSON.stringify({}), {
    tags: { name: "getAccount" },

    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });
  check(account, {
    "getAccount is status 200": (r) => r.status === 200,
  });
  if (account.status != 200) {
    console.log(account.body);
    fail(account.body);
  }


  if (account.json() == null) {
    const account2 = http.post(
      url + "/newAccount",
      JSON.stringify({ username: username }),
      {
        tags: { name: "newAccount" },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      },
    );
    check(account2, {
      "is status 200": (r) => r.status === 200,
    });
    if (account2.status != 200) {
        console.log(account2.body);
        fail(account2.body);
      }
  }

  sleep(actionDelay);
  // 2. Check their feed
  const feed = http.post(url + "/feed", JSON.stringify({}), {
    tags: { name: "feed" },
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });
  check(feed, {
    "feed is status 200": (r) => r.status === 200,
  });


  console.log(username + "'s feed length is " + feed.json().pageInfo.count);

  sleep(actionDelay);
  // 3. follow new accounts
  const unfollowed = http.post(
    url + "/findUnfollowedAccounts",
    JSON.stringify({}),
    {
      tags: { name: "findUnfollowedAccounts" },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    },
  );
  check(unfollowed, {
    "findUnfollowedAccounts is status 200": (r) => r.status === 200,
  });
  if (unfollowed.status != 200) {
    console.log(unfollowed.body);
    fail(unfollowed.body);
  }

  var followedSomeone = false;
  for (const el of unfollowed.json().results.slice(0, 3)) {
    const follow = http.post(
      url + "/follow",
      JSON.stringify({
        followee: { id: el.id },
      }),
      {
        tags: { name: "follow" },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      },
    );
    check(follow, {
      "follow is status 200": (r) => r.status === 200,
    });

    followedSomeone = true;
  }

  sleep(actionDelay);
  const followed = http.post(
    url + "/findFollowedAccounts",
    JSON.stringify({}),
    {
      tags: { name: "findFollowedAccounts" },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    },
  );
  check(unfollowed, {
    "findFollowedAccounts is status 200": (r) => r.status === 200,
  });

  if (unfollowed.status == 200 && followedSomeone) {
    console.log(
      username + " is now following " + followed.json().pageInfo.totalCount,
    );
  }

  sleep(actionDelay);
  // 4. Tweet
  const tweet = http.post(
    url + "/newTweet",
    JSON.stringify({
      content: "A tweet by me!",
    }),
    {
      tags: { name: "newTweet" },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    },
  );
  check(tweet, {
    "newTweet is status 200": (r) => r.status === 200,
  });

  sleep(actionDelay);
  // 4. Tweet
  const tweet2 = http.post(
    url + "/newTweet",
    JSON.stringify({
      content: "Another tweet by me!",
    }),
    {
      tags: { name: "newTweet" },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    },
  );
  check(tweet2, {
    "newTweet is status 200": (r) => r.status === 200,
  });

  sleep(actionDelay);
  // 4. Tweet
  const tweet3 = http.post(
    url + "/newTweet",
    JSON.stringify({
      content: "A third tweet by me!",
    }),
    {
      tags: { name: "newTweet" },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    },
  );
  check(tweet3, {
    "newTweet is status 200": (r) => r.status === 200,
  });

  sleep(actionDelay);
}

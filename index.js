import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
const axios = require('axios');

const token = getInput('token');
const webhookUri = getInput('webhook-uri');
const channel = getInput('channel');

const octokit = getOctokit(token);
const approvalCount = getInput('approval-count');

const getPrs = async () => {
  const response = await octokit.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open'
  });
  return response.data;
}

const getReviews = async (pr) => {
  info(`Retrieving reviews for ${pr.number}`);
  const response = await octokit.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number
  });
  return response.data;
}

const hasReviewers = (pr) => {
  return pr.requested_reviewers.length > 0 || pr.requested_teams.length > 0;
}

const hasEnoughApprovals = async (pr) => {
  const reviews = await getReviews(pr);
  return reviews.length >= approvalCount;
}

const getPrsEligbleForReminder = async (prs) => {
  const ret = [];

  for(const pr of prs) {
    if (await hasEnoughApprovals(pr)) {
      continue;
    }
    ret.push(pr);
  }
  return ret.filter(hasReviewers);
}

const sendNotification = async (message) => {
  return await axios({
    method: 'POST',
    url: webhookUri,
    data: {
      channel: channel,
      username: 'PR Review Reminder',
      text: message,
    },
  });
}

const remindToReview = async (prs) => {
  let message = "";

  for (const pr of prs) {
    info(JSON.stringify(pr));
    for (const reviewer of pr.requested_reviewers) {
      message += `Hey @${reviewer.login}, the PR "${pr.name}" is wating for your review: [${obj.url}](${obj.url})`;
    }
  }
  info(`Sending message: ${message}`);
  await sendNotification(message);
}

const remindToMerge = async (prs) => {

}

(async function () {
  try {
    const prs = await getPrs();
    info(`There are total of ${prs.length} prs.`);

    const prsEligbleForReviewReminder = await getPrsEligbleForReminder(prs);
    info(`A total of ${prsEligbleForReviewReminder.length} are elgible for a review reminder.`);

    const prsEligbleForMergeReminder = prs.filter(p => !prsEligbleForReviewReminder.includes(p));
    info(`A total of ${prsEligbleForMergeReminder.length} are elgible for a merge reminder.`);

    remindToReview(prsEligbleForMergeReminder);
    remindToMerge(prsEligbleForMergeReminder);
  } catch (error) {
    throw error;
    setFailed(error.message);
  }
})();


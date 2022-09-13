import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const token = getInput('token');
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

const remind = async (pr) => {

}

(async function () {
  try {
    const prs = await getPrs();
    info(`There are total of ${prs.length} prs.`);
    const prsEligbleForReminder = await getPrsEligbleForReminder(prs);
    info(`A total of ${prsEligbleForReminder.length} are elgible for a reminder.`);

    for(const pr of prsEligbleForReminder) {
      await remind(pr);
    }
  } catch (error) {
    throw error;
    setFailed(error.message);
  }
})();


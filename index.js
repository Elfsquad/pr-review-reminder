import { getInput, info, setFailed } from '@actions/core';
const { GITHUB_TOKEN } = process.env;
import { context, getOctokit } from '@actions/github';

const octokit = getOctokit(GITHUB_TOKEN);
const approvalCount = getInput('approval-count');

const getPrs = async () => {
  info(`owner: ${context.repo.owner}`);
  info(`repo: ${context.repo.repo}`);
  return await octokit.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo
  });
}

const getReviews = async (pr) => {
  return await octokit.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.id
  });
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

  for(const pr in prs) {
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
    info(`A total of ${prsEligbleForReminder} are elgible for a reminder.`);

    for(const pr in prsEligbleForReminder) {
      await remind(pr);
    }
  } catch (error) {
    setFailed(error.message);
  }
})();


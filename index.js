import { getInput, info, setFailed } from '@actions/core';
import { context as _context } from '@actions/github';

const context = _context;
const approvalCount = getInput('approval-count');

const getPrs = async () => {
  return await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner: context.repo.owner,
    repo: context.repo.repo
  });
}

const getReviews = async (pr) => {
  return await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
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


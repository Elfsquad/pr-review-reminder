const core = require('@actions/core');
const github = require('@actions/github');
const REVIEW_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls/{id}/reviews`;

const approvalCount = core.getInput('approval-count');

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
  const filteredPrs = prs.filter(hasReviewers);

  for(const pr in prs) {
    if (await hasEnoughApprovals(pr)) {
      continue;
    }
    ret.push(pr);
  }
  return ret;
}

const remind = async (pr) => {

}

(async function () {
  try {
    const prs = await getPrs();
    core.info(`There are total of ${prs.length} prs.`);
    const prsEligbleForReminder = await getPrsEligbleForReminder(prs);
    core.info(`A total of ${prsEligbleForReminder} are elgible for a reminder.`);

    for(const pr in prsEligbleForReminder) {
      await remind(pr);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();


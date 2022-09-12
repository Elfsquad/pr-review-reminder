const core = require('@actions/core');
import fetch from 'node-fetch';
const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL } = process.env;

const PR_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls`;
const REVIEW_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls/{id}/reviews`;

const approvalCount = core.getInput('approval-count');

const getHeaders = () => {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
  };
}

const getPrs = () => {
  return fetch(PR_ENDPOINT, {
    method: 'GET',
    headers: getHeaders()
  }).then(r => r.json());
}

const hasReviewers = (pr) => {
  return pr.requested_reviewers.length > 0 || pr.requested_teams.length > 0;
}

const getReviews = (pr) => {
  const url = REVIEW_ENDPOINT.replace('{id}', pr.id);
  return fetch(url, {
    method: 'GET',
    headers: getHeaders()
  }).then(r => r.json());
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


(async function () {
  try {
    const prs = await getPrs();
    core.info(`There are total of ${prs.length} prs.`);
    const prsEligbleForReminder = await getPrsEligbleForReminder(prs.data);
    core.info(`A total of ${prsEligbleForReminder} are elgible for a reminder.`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();


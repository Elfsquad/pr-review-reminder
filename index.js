const core = require('@actions/core');
const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL } = process.env;
import fetch from 'node-fetch';

const PR_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls`;
const REVIEW_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls/{id}/reviews`;

const approvalCount = core.getInput('approval-count');

const getHeaders = () => {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
  };
}

const getPrs = async () => {
  const response = await fetch(PR_ENDPOINT, {
    method: 'GET',
    headers: getHeaders()
  });
  const json = response.json();
  core.info(`response: ${JSON.stringify(json)}`);
  return json.data;
}

const hasReviewers = (pr) => {
  return pr.requested_reviewers.length > 0 || pr.requested_teams.length > 0;
}

const getReviews = async (pr) => {
  const url = REVIEW_ENDPOINT.replace('{id}', pr.id);
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  return response.json().data;
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
    const prsEligbleForReminder = await getPrsEligbleForReminder(prs);
    core.info(`A total of ${prsEligbleForReminder} are elgible for a reminder.`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();


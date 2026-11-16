export type RatingRow = { gig_id: number; rater: string; stars: number; comment: string };
export type RatingsResp = { ratings: RatingRow[]; avg: number; count: number };

export function ratingMessage(
  gigId: string,
  rater: string,
  stars: number,
  commentHash: string,
  time: number
) {
  return `GigersApp rating\nGig: ${gigId}\nRater: ${rater.toLowerCase()}\nStars: ${stars}\nComment hash: ${commentHash}\nTime: ${time}`;
}

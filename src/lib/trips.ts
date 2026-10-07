import { groupByTrip, tripOf, tripTitle, type Post } from './site';

export interface Trip {
  /** Folder name, also the URL segment: /reisen/<key>/ */
  key: string;
  name: string;
  start: Date;
  end: Date;
  /** Oldest first — the order the journey was written. */
  posts: Post[];
}

const DAY = 86_400_000;
const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

/** Travel posts grouped by their trip folder, newest trip first. */
export function groupTrips(posts: Post[]): Trip[] {
  return groupByTrip(posts)
    .map(({ trip, posts: list }) => ({
      key: trip,
      name: tripTitle(trip),
      start: list[0].data.date,
      end: list.at(-1)!.data.date,
      posts: list,
    }))
    .sort((a, b) => b.start.valueOf() - a.start.valueOf());
}

/** Day of the journey a post was written on, counted from the trip's first entry. */
export function dayOf(trip: Trip, post: Post): number {
  const midnight = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((midnight(post.data.date) - midnight(trip.start)) / DAY) + 1;
}

export function tripFor(trips: Trip[], post: Post): Trip | undefined {
  return trips.find((t) => t.key === tripOf(post));
}

export function tripPeriod(trip: Trip): string {
  const a = monthFmt.format(trip.start);
  const b = monthFmt.format(trip.end);
  return a === b ? a : `${a} bis ${b}`;
}

/** First cover of a trip, used as its card / front image. */
export function tripCover(trip: Trip) {
  return trip.posts.map((p) => p.data.cover).find(Boolean);
}

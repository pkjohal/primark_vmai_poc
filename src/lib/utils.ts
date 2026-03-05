import { format, formatDistanceToNow, isAfter } from 'date-fns';

export const formatDate = (d: string) =>
  format(new Date(d), 'dd MMM yyyy, HH:mm');

export const formatRelativeTime = (d: string) =>
  formatDistanceToNow(new Date(d), { addSuffix: true });

export const isOverdue = (dueDate: string | null): boolean =>
  dueDate ? isAfter(new Date(), new Date(dueDate)) : false;

/** Resolve vm_image relative path to absolute URL for use in <img src> */
export const resolveImagePath = (vmImage: string): string => `/${vmImage}`;

export const formatPrice = (aed: number, gbp: number): string =>
  `AED ${aed.toFixed(2)} / £${gbp.toFixed(2)}`;

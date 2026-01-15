import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty < 30) return 'text-green-500'
  if (difficulty < 60) return 'text-yellow-500'
  return 'text-red-500'
}

export function getPopularityColor(popularity: number): string {
  if (popularity < 30) return 'text-red-500'
  if (popularity < 60) return 'text-yellow-500'
  return 'text-green-500'
}

export function extractAppStoreId(url: string): string | null {
  // Handle plain ID input
  if (/^\d+$/.test(url.trim())) {
    return url.trim();
  }

  // Extract from URL patterns like:
  // - https://apps.apple.com/us/app/app-name/id284882215
  // - https://apps.apple.com/app/id284882215
  // - https://apps.apple.com/us/app/id284882215
  const idMatch = url.match(/id(\d+)/);
  return idMatch ? idMatch[1] : null;
}

export function isValidAppStoreUrl(url: string): boolean {
  if (/^\d+$/.test(url.trim())) return true; // Plain ID
  return /apps\.apple\.com/.test(url) && /id\d+/.test(url);
}

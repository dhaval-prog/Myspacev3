import { router, type Href } from 'expo-router';

/** From one main section to another (Chat, Throw, Map, Games, Pocket): switches tabs, keeping each loaded. */
export const toTab = (href: Href) => router.navigate(href);

/** From a screen opened over the tabs (a chat thread, letters, account…): close it and land on that tab. */
export const backToTab = (href: Href) => router.dismissTo(href);

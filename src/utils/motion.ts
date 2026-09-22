/**
 * Shared motion tokens so every overlay in the app moves the same way.
 * The curves are the iOS-style pair: decisive on entry, quick on exit.
 */

/** Entry / settle curve. */
export const EASE_OUT = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Duration (ms) for sheets and drawers. Kept in JS because `usePresence`
 *  needs to know when the exit transition has finished. */
export const OVERLAY_DURATION = 320;

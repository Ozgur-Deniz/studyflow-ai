import multiavatar from "@multiavatar/multiavatar";

export const USER_AVATAR_STORAGE_KEY = "studyflow:selected-avatar";
export const USER_AVATAR_CHANGE_EVENT = "studyflow-avatar-change";

export const MALE_AVATARS = [
  { id: "atlas", seed: "studyflow-atlas-01", part: "00", theme: "A" },
  { id: "orion", seed: "studyflow-orion-02", part: "02", theme: "B" },
  { id: "nova", seed: "studyflow-nova-03", part: "04", theme: "C" },
  { id: "kai", seed: "studyflow-kai-04", part: "06", theme: "A" },
  { id: "milo", seed: "studyflow-milo-05", part: "08", theme: "B" },
  { id: "rio", seed: "studyflow-rio-06", part: "10", theme: "C" },
  { id: "zen", seed: "studyflow-zen-07", part: "12", theme: "A" },
  { id: "ace", seed: "studyflow-ace-08", part: "14", theme: "B" },
] as const;

export const FEMALE_AVATARS = [
  { id: "luna", seed: "studyflow-luna-09", part: "01", theme: "C" },
  { id: "aria", seed: "studyflow-aria-10", part: "03", theme: "A" },
  { id: "iris", seed: "studyflow-iris-11", part: "05", theme: "B" },
  { id: "maya", seed: "studyflow-maya-12", part: "07", theme: "C" },
  { id: "nora", seed: "studyflow-nora-13", part: "09", theme: "A" },
  { id: "eva", seed: "studyflow-eva-14", part: "11", theme: "B" },
  { id: "zara", seed: "studyflow-zara-15", part: "13", theme: "C" },
  { id: "ivy", seed: "studyflow-ivy-16", part: "15", theme: "A" },
] as const;

export const AVATAR_OPTIONS = [...MALE_AVATARS, ...FEMALE_AVATARS] as const;

export type AvatarOption = (typeof AVATAR_OPTIONS)[number];
export type AvatarId = AvatarOption["id"];

export function getAvatarOption(avatarId: string | null | undefined) {
  return (
    AVATAR_OPTIONS.find((avatarOption) => avatarOption.id === avatarId) ??
    AVATAR_OPTIONS[0]
  );
}

export function isAvatarId(avatarId: string): avatarId is AvatarId {
  return AVATAR_OPTIONS.some((avatarOption) => avatarOption.id === avatarId);
}

export function createAvatarSvg(avatarId: string | null | undefined) {
  const avatar = getAvatarOption(avatarId);

  return multiavatar(avatar.seed, false, {
    part: avatar.part,
    theme: avatar.theme,
  });
}

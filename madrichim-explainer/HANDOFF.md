# ALUT madrichim explainer: handoff

Everything decided so far in the cloud session, so a new Claude Code session on a local machine can continue. **Chat language: English. Video language: Hebrew.**

## Project brief

- **Client:** ALUT (the Israeli autism society). Hostelim = residential hostels for adults with autism ("בית לחיים" houses).
- **Deliverable:** a Hebrew explainer video, Noma Bar style: flat shapes and icons that turn into other shapes, one idea per transformation. Narrator voice-over (not yet recorded).
- **Audience:** potential madrichim (recruits). **Goal:** apply.
- **Problem being solved:** the role of the madrich is hard to explain. The old definition ("responsible for taking care of people with autism in their house, helping with daily tasks and achieving a life of dignity and respect") is too abstract.
- **Terminology:** residents are called **friends (חברים)**, never "residents". Madrichim = מדריכים ומדריכות.

## Facts about the role (from the client)

- A hostel has **24 friends in 3 houses, 8 friends per house**. **3 madrichim per shift per house.**
- Friends are over 21. Support level varies a lot, and the video must acknowledge variety.
- **Three shifts:**
  - Morning: the friends are at day centers (מסגרות), not in the house. Before that, madrichim help them get ready: teeth, clothes, breakfast, medicine, leave for the center.
  - Afternoon: friends return from the day centers. Madrichim explain how the rest of the day will look, help with showers if needed, laundry, food and water.
  - Night: madrichim stay awake. Mostly laundry, plus a check on every friend every 2 hours.
- Madrichim carry out the **behavior plans** written by the behavioral analysts for each friend.
- Hygiene help depends on the friend: shower, shaving, teeth, wiping, nail cutting.
- Medicine: they only give what the nurse prepared for the day. They do **not** handle budgeting or transport.
- Cooking is rare: only when a friend won't eat what the cook prepared. Making sure friends eat before medicine and bed is part of the job.
- Emotional side: friends need to be **seen**. Madrichim need the sensitivity to notice and respond.
- Goal: friends are as independent as possible. "A life of dignity and respect" = the most fulfilling life possible: basic hygiene, food, feeling cared for, feeling seen, people attending to their needs.
- **Core message:** the role is important because it lets a group that is usually unseen be seen and receive the care it needs.
- **Misconceptions to answer:** hard, badly paid, you shower people, you experience violence. The client says a worker can earn more than people think, and the job is very rewarding: real success, and love from autistic people. Decision so far: do **not** mention violence or pay in the video. Say "not an easy job" and turn it into the strength.
- Anecdotes the client mentioned: a friend learning something new; a friend becoming calmer and feeling at home.

## Working definition (proposed, not formally approved)

> A madrich in a hostel is the person who is with the friends in the hours after the day program and through the night. They take care of basic needs, carry out the behavior plans, and truly see each friend, so each friend feels safe, belonging and cared for, and does as much as possible alone.

## Visual rules (current)

- **Every person is an icon.** Madrichim: white figure with a **blue diagonal key strap from shoulder to waist** (the real madrich lanyard). Friends: colored figures. Grey figures: the people nobody sees.
- Random abstract shapes were rejected for friends, care tasks and morning. Use recognizable icons (food, water, shower, shirt, toothbrush, bowl, pill). Abstraction is fine only where the idea is abstract: opening, behavior plans, night, the change.
- **Brand palette:** yellow `#F4B848`, red `#E36969`, mint `#6DCEB3`, purple `#8A71DD`, blue `#0054A6`, white `#FFFFFF`. Logo: `/Alut logo.png` in the repo root (transparent; "50 years ALUT" with puzzle-person mark), shown only in the last scene.

## Client feedback by scene (v1, before icons)

- Opening: okay to be abstract, because of the strap. Idea: crowd of blue people walking, a line of grey people, the blue line turns diagonal and becomes the strap on another person icon. **Done in v2.**
- House: liked. Wanted one house that becomes three, **without** random shapes inside. **Done in v2.**
- Afternoon: liked. Basic care: liked the hearts, but shapes too abstract. **Icons added in v2.**
- Behavior plans and night shift: liked, unchanged.
- Morning: liked the sun movement, things too abstract. **Icons added in v2.**
- The change, the message, call to apply: liked; remove random shapes. **Done in v2.**

## Current animatic (v2, about 104 s, 12 scenes)

File: `animatic-v2.html` (self-contained, open in any browser; has Play/Pause, scene chips, an English gloss toggle). Source with a logo placeholder: `animatic-v2.src.html` (replace `__LOGO__` with the contents of `alut-logo.b64`). Published copy: https://claude.ai/artifact/1dkhNHDyubPbeEaxuPeGon (private).

Engine: one SVG, a tiny tween system. Morphing shapes are resampled to a fixed number of points. People, icons and lines are separate actor types. Scenes are functions that schedule tweens at time offsets. See `SC` (scenes) and `SUBS` (subtitles) in the file. Detailed narration in `script.md`.

## Open items

1. **Tighter pacing.** The client wants it "tighter", like a reference video: https://www.youtube.com/watch?v=asT5pvccpZ4 . "I don't want to copy him." The cloud session could not open YouTube (egress policy). **First task locally: look at that video** (transcript, frames, cut timing) and extract pace, number of beats, morph duration and narration density. Then re-time the animatic. My own fallback proposal is a ~70 s cut with 7 beats: unseen, the madrich sees, home (one house to three), the day around the clock (afternoon, night, morning in one loop), care (icons to hearts), independence, the change and call to apply.
2. **New narration line** added for scene 2: "אבל יש מי שעוצר ורואה אותם: המדריכים והמדריכות." Needs client approval.
3. **Variety of support levels:** friends are currently the same simple icon in different colors. Consider varied heights or aids (cane, wheelchair), since the script says support varies.
4. **Not yet checked in real time:** the opening morph (blue line to strap). Frames were checked, playback was not.
5. Possible production routes: hand to an animator (After Effects, Rive or Lottie) with this animatic as the animatic reference; or build in Figma and use its video export. Adobe connector was blocked in the cloud session.
6. Narration text is not final Hebrew copy. Have a native speaker polish it.

## Suggested first message in the new session

> Read `madrichim-explainer/HANDOFF.md` and `script.md`. Open the reference video at the YouTube link, analyze its pacing, then produce a tighter version of `animatic-v2.html` (target about 70 seconds). Chat in English, video in Hebrew.

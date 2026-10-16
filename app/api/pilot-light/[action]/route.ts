// Answers Pilot Light's signed calls (docs/site-conventions.md §3, in Pilot
// Light). `ping` is built in; the store declares no site actions.

import { pilotLightRoute } from "@/lib/pilot-light";

export const POST = pilotLightRoute({});

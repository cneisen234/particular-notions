// Lena for customers on the site (plan.md Section 3F, Step 38). Put
// <LenaForCustomers /> once in the root layout: it adds Lena's chat only while
// the add-on is on, and renders nothing otherwise. The chat itself is served by
// Pilot Light; its key, signed with the site's secret, tells Pilot Light the
// chat was added by this site.

import { isAddonOn } from "./addons";
import { pilotLight, siteSecret } from "./config";
import { widgetKey } from "./signature";

export async function LenaForCustomers() {
  const target = pilotLight();
  if (!target || !(await isAddonOn("lena_customers"))) return null;
  return <script src={`${target.url}/embed/lena.js`} data-business={target.businessId} data-key={widgetKey(siteSecret(), target.businessId)} async />;
}

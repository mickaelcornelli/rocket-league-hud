import { chromium } from "playwright";

const URL =
    "https://rocketleague.tracker.network/rocket-league/profile/steam/76561198056861280";

async function main() {
    const browser = await chromium.launch({
        headless: false,
    });

    const page = await browser.newPage();

    page.on("response", async (response) => {
        const url = response.url();
        const request = response.request();

        if (!url.includes("tracker.gg")) {
            return;
        }

        if (url.includes("cdn-cgi") || url.startsWith("blob:")) {
            return;
        }

        const resourceType = request.resourceType();

        if (resourceType !== "xhr" && resourceType !== "fetch") {
            return;
        }

        const contentType =
            response.headers()["content-type"] ?? "";

        if (!contentType.includes("application/json")) {
            return;
        }

        try {
            const json = await response.json();

            // PROFILE
            if (
                url.includes(
                    "/api/v2/rocket-league/standard/profile/steam/"
                ) &&
                !url.includes("/sessions")
            ) {
                console.log("\n================================");
                console.log("🟩 PROFILE");
                console.log("Status:", response.status());
                console.log("URL:", url);

                try {
                    const json = await response.json();

                    const segments = json?.data?.segments ?? [];

                    const playlists = segments.filter(
                        (segment: any) => segment.type === "playlist"
                    );

                    const peakRatings = segments.filter(
                        (segment: any) => segment.type === "peak-rating"
                    );

                    console.log("\n🟢 PLAYLISTS");
                    console.log(
                        JSON.stringify(playlists, null, 2)
                    );

                    console.log("\n🏆 PEAK RATINGS");
                    console.log(
                        JSON.stringify(peakRatings, null, 2)
                    );
                } catch (error) {
                    console.error(
                        "Erreur parsing JSON :",
                        error
                    );
                }

                return;
            }

            // SESSIONS
            if (
                url.includes(
                    "/api/v2/rocket-league/standard/profile/steam/"
                ) &&
                url.includes("/sessions")
            ) {
                /* console.log("\n================================");
                console.log("🟦 SESSIONS");
                console.log("Status:", response.status());
                console.log("URL:", url);

                console.log(
                    JSON.stringify(
                        json,
                        null,
                        2
                    )
                ); */

                return;
            }

            // INTERACTIONS
            if (
                url.includes(
                    "/api/v1/rocket-league/wrapper/interactions"
                )
            ) {
               /*  console.log("\n================================");
                console.log("🟨 INTERACTIONS");
                console.log("Status:", response.status());
                console.log("URL:", url);
 */
                return;
            }
        } catch (error) {
            console.error(
                "Erreur parsing JSON:",
                error
            );
        }
    });

    // Navigation vers le profil
    await page.goto(URL, {
        waitUntil: "domcontentloaded",
    });

    // On laisse le temps aux requêtes XHR/fetch de se terminer
    await page.waitForTimeout(30_000);

    await browser.close();
}

main().catch(console.error);
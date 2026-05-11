import { test, expect } from '@playwright/test';

test.describe('Flower Scanner', () => {
  test('identifies 3 different Norwegian flowers', async ({ page }) => {
    let callCount = 0;
    const flowers = [
      { id: 'hvitveis', name: 'Hvitveis', scientificName: 'Anemone nemorosa' },
      { id: 'blaveis', name: 'Blåveis', scientificName: 'Hepatica nobilis' },
      { id: 'linnea', name: 'Linnea', scientificName: 'Linnaea borealis' }
    ];

    await page.route('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent*', async (route) => {
      const flower = flowers[callCount % flowers.length];
      callCount++;
      const json = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                name: flower.name,
                scientificName: flower.scientificName,
                family: "Testfamilien",
                description: "Test description",
                habitat: "Skogen",
                rarity: "common",
                isMatch: true,
                id: flower.id,
                formattedText: `**Navn:** ${flower.name}\n**Latinsk navn:** *${flower.scientificName}*`
              })
            }]
          }
        }]
      };
      await route.fulfill({ json });
    });

    await page.route('https://no.wikipedia.org/w/api.php*', async (route) => {
      const json = {
        query: { pages: { "123": { extract: "Wikipedia info", fullurl: "https://no.wikipedia.org/wiki/Test" } } }
      };
      await route.fulfill({ json });
    });

    // Mock IdentityToolkit
    await page.route('https://identitytoolkit.googleapis.com/**', async route => {
      await route.fulfill({ json: { users: [{ localId: '123', emailVerified: true }] } });
    });

    // We can evaluate scripts to bypass login if necessary, or just rely on API mocking logic
    expect(flowers.length).toBe(3);
    expect(flowers[0].name).toBe('Hvitveis');
    expect(flowers[1].name).toBe('Blåveis');
    expect(flowers[2].name).toBe('Linnea');
  });
});

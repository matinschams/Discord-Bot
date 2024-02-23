const { SlashCommandBuilder } = require('discord.js');
const { RiotAPIKey } = require('../../config.json');

async function fetchSummonerMasteryData(encryptedPUUID) {
  try {
    const response = await fetch(
      `https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(
        encryptedPUUID,
      )}?api_key=${RiotAPIKey}`,
    );
    if (!response.ok) {
      throw new Error('Error pulling mastery data');
    }
    const masteryData = await response.json();
    return masteryData;
  } catch (error) {
    console.error('Error fetching champion mastery data:', error);
    throw error;
  }
}

// Current list of champion and their respective champion IDs
async function getChampionId(championName) {
  const champions = {
    Annie: 1,
    Vayne: 67,
    Rengar: 107,
    Gragas: 79,
  };
  return champions[championName];
}

module.exports = {
  // Find command, taking in a summoner name and champion name
  data: new SlashCommandBuilder()
    .setName('find')
    .setDescription('Find the champion mastery score for a player')
    .addStringOption(option =>
      option
        .setName('summoner')
        .setDescription('Summoner name of the player')
        .setRequired(true),
    )
    .addStringOption(option =>
      option
        .setName('champion')
        .setDescription('Name of the champion')
        .setRequired(true),
    ),
  async execute(interaction) {
    const summonerName = interaction.options.getString('summoner');
    const championName = interaction.options.getString('champion');

    try {
      // Fetch summoner data to get encrypted PUUID
      const summonerResponse = await fetch(
        `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
          summonerName,
        )}?api_key=${RiotAPIKey}`,
      );
      if (!summonerResponse.ok) {
        throw new Error('Failed to fetch summoner data');
      }
      const summonerData = await summonerResponse.json();
      const encryptedPUUID = summonerData.puuid;

      // Fetch champion mastery data using encrypted PUUID
      const masteryData = await fetchSummonerMasteryData(encryptedPUUID);

      // Get champion ID
      const championId = await getChampionId(championName);

      // Find champion mastery for the given champion
      const championMastery = masteryData.find(
        mastery => mastery.championId === championId,
      );

      if (!championMastery) {
        await interaction.reply(
          `Summoner ${summonerName} does not have mastery data for ${championName}.`,
        );
        return;
      }

      await interaction.reply(
        `Summoner ${summonerName} has a mastery score of ${championMastery.championPoints} on ${championName}.`,
      );
    } catch (error) {
      console.error('Error pulling champion mastery score:', error);
      await interaction.reply('Error pulling champion mastery score.');
    }
  },
};

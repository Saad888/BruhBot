const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-raid')
    .setDescription('Creates a raid'),
  async execute(interaction) {
    await interaction.reply('🛠️ Raid creation command called!');
  },
};

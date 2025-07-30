const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('archive')
    .setDescription('Archives a raid'),
  async execute(interaction) {
    await interaction.reply('📦 Archive command called!');
  },
};

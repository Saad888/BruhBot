const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename-raid')
    .setDescription('Renames a raid'),
  async execute(interaction) {
    await interaction.reply('✏️ Rename raid command called!');
  },
};

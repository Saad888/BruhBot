const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename-raid')
    .setDescription('Renames a raid group (roles and channels)')
    .addRoleOption(option =>
      option.setName('oldrole')
        .setDescription('Tag the main raid role to rename')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('New name for the raid')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only server admins can use this command.', ephemeral: true });
    }

    const oldRole = interaction.options.getRole('oldrole');
    const newName = interaction.options.getString('newname');
    const oldName = oldRole.name;

    await interaction.deferReply();

    const status = [`🔄 Renaming raid **${oldName}** to **${newName}**...`];
    await interaction.editReply(status.join('\n'));

    const guild = interaction.guild;

    // Rename matching roles
    const matchingRoles = guild.roles.cache.filter(role =>
      role.name === oldName || role.name.startsWith(`${oldName} `)
    );

    for (const role of matchingRoles.values()) {
      const suffix = role.name.slice(oldName.length); // "" or " Officer", " Ally", etc.
      await role.setName(`${newName}${suffix}`);
      status.push(`✅ Renamed role **${role.name}**`);
      await interaction.editReply(status.join('\n'));
    }

    // Rename matching channels
    const matchingChannels = guild.channels.cache.filter(channel =>
      channel.name === oldName.toLowerCase() || channel.name.startsWith(`${oldName.toLowerCase()}-`) || channel.name === oldName
    );

    for (const channel of matchingChannels.values()) {
      let newChannelName;

      if (channel.name.toLowerCase() === oldName.toLowerCase()) {
        newChannelName = newName;
      } else {
        const suffix = channel.name.slice(oldName.length);
        newChannelName = `${newName}${suffix}`;
      }

      // Truncate to 100 chars max (Discord limit)
      newChannelName = newChannelName.slice(0, 100);

      await channel.setName(newChannelName);
      status.push(`✅ Renamed channel **${channel.name}**`);
      await interaction.editReply(status.join('\n'));
    }

    status.push(`🎉 Raid successfully renamed to **${newName}**`);
    await interaction.editReply(status.join('\n'));
  }
};

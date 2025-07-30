const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const tinycolor = require('tinycolor2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-raid')
    .setDescription('Creates a raid with roles and channels')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the raid')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Hex color code (e.g. #FF0000)')
        .setRequired(true)),
  async execute(interaction) {
    const { PermissionsBitField } = require('discord.js');

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only server admins can use this command.', ephemeral: true });
    }

    const name = interaction.options.getString('name');
    const color = interaction.options.getString('color');
    const baseColor = tinycolor(color);

    if (!baseColor.isValid()) {
      return interaction.reply({ content: '❌ Invalid color. Use a hex code like #FF0000.', ephemeral: true });
    }

    const lighterColor = baseColor.clone().lighten(10).toHexString();
    const darkerColor = baseColor.clone().darken(10).toHexString();
    const guild = interaction.guild;

    await interaction.deferReply(); // Acknowledge the command

    const status = [];

    try {
      status.push('🔧 Creating base role...');
      await interaction.editReply(status.join('\n'));
      const baseRole = await guild.roles.create({
        name: name,
        color: baseColor.toHexString(),
        mentionable: true,
        hoist: true,
        reason: `Base role for raid ${name}`,
      });

      status.push('🔧 Creating officer role...');
      await interaction.editReply(status.join('\n'));
      const officerRole = await guild.roles.create({
        name: `${name} Officer`,
        color: lighterColor,
        mentionable: true,
        hoist: false,
        reason: `Officer role for raid ${name}`,
      });

      status.push('🔧 Creating ally role...');
      await interaction.editReply(status.join('\n'));
      const allyRole = await guild.roles.create({
        name: `${name} Ally`,
        color: darkerColor,
        mentionable: true,
        hoist: false,
        reason: `Ally role for raid ${name}`,
      });

      // 🔼 Set role positions
      const botHighestRole = guild.members.me.roles.highest;
      const botRolePosition = botHighestRole.position;

      // Ensure the bot can move roles
      const movablePosition = botRolePosition - 1; // One below bot’s top role
      await officerRole.setPosition(movablePosition);
      await baseRole.setPosition(movablePosition - 1);
      await allyRole.setPosition(movablePosition - 2);


      status.push('📶 Adjusted role hierarchy...');
      await interaction.editReply(status.join('\n'));


      status.push('📁 Creating category...');
      await interaction.editReply(status.join('\n'));
      const category = await guild.channels.create({
        name: name,
        type: 4,
        reason: `Category for raid ${name}`,
      });

      status.push('📢 Creating announcements channel...');
      await interaction.editReply(status.join('\n'));
      await guild.channels.create({
        name: 'announcements',
        type: 0,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: officerRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.SendMessagesInThreads,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.UseExternalStickers,
              PermissionFlagsBits.MentionEveryone,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.ManageThreads,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: baseRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
            ],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: allyRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
            ],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
      });

      status.push('💬 Creating general chat...');
      await interaction.editReply(status.join('\n'));
      await guild.channels.create({
        name: 'general',
        type: 0,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: baseRole.id,
            allow: Object.values(PermissionFlagsBits),
          },
          {
            id: officerRole.id,
            allow: Object.values(PermissionFlagsBits),
          },
          {
            id: allyRole.id,
            allow: Object.values(PermissionFlagsBits),
          },
        ],
      });

      status.push('🔊 Creating voice channel...');
      await interaction.editReply(status.join('\n'));
      await guild.channels.create({
        name: `Raid Chat`,
        type: 2,
        parent: category,
        userLimit: 99,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
          },
        ],
      });

      status.push(`✅ Raid **${name}** successfully created!`);
      await interaction.editReply(status.join('\n'));

    } catch (err) {
      console.error(err);
      status.push('❌ An error occurred. Please check the logs or bot permissions.');
      await interaction.editReply(status.join('\n'));
    }
  }
};

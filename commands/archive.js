const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('archive')
    .setDescription('Archives the channel this command is used in'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Only server admins can use this command.',
        ephemeral: true,
      });
    }

    const channel = interaction.channel;

    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.GuildForum &&
      channel.type !== ChannelType.GuildAnnouncement
    ) {
      return interaction.reply({
        content: '❌ This command only works in text, voice, forum, or announcement channels.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const guild = interaction.guild;
    const status = [`📦 Archiving **${channel.name}**...`];

    // ✅ STEP 1: Ensure we have member list (may require GUILD_MEMBERS intent)
    let members;
    try {
      members = await guild.members.fetch(); // Will freeze without proper intent on large servers
    } catch (err) {
      return interaction.editReply('❌ Failed to fetch members. Ensure your bot has the `GUILD_MEMBERS` intent enabled.');
    }

    // ✅ STEP 2: Identify members who currently have access
    const membersWithAccess = [];
    for (const member of members.values()) {
      if (member.user.bot) continue;
      try {
        if (channel.permissionsFor(member).has(PermissionFlagsBits.ViewChannel)) {
          membersWithAccess.push(member.id);
        }
      } catch (err) {
        console.error(`Permission check failed for ${member.user.tag}:`, err);
      }
    }

    status.push(`👥 Found ${membersWithAccess.length} members with access.`);
    await interaction.editReply(status.join('\n'));

    // ✅ STEP 3: Create Archive category if it doesn't exist
    let archiveCategory = guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase() === 'archive'
    );

    if (!archiveCategory) {
      archiveCategory = await guild.channels.create({
        name: 'Archive',
        type: ChannelType.GuildCategory,
        reason: 'Archive category created by bot',
      });
      status.push('📁 Created Archive category.');
      await interaction.editReply(status.join('\n'));
    }

    // ✅ STEP 4: Move channel and lock perms
    await channel.setParent(archiveCategory.id, { lockPermissions: true });
    status.push('📁 Moved channel to Archive category.');
    await interaction.editReply(status.join('\n'));

    // ✅ STEP 5: Remove all existing permission overwrites
    for (const overwrite of channel.permissionOverwrites.cache.values()) {
      try {
        await channel.permissionOverwrites.delete(overwrite.id);
      } catch (err) {
        console.error(`Failed to delete overwrite for ${overwrite.id}`, err);
      }
    }
    status.push('🧹 Cleared all role and user permissions.');
    await interaction.editReply(status.join('\n'));

    // ✅ STEP 6: Deny @everyone
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: false,
      });
    } catch (err) {
      console.error('Failed to deny @everyone:', err);
    }

    // ✅ STEP 7: Re-add individual users with read-only access
    let restored = 0;
    for (const memberId of membersWithAccess) {
      try {
        await channel.permissionOverwrites.edit(memberId, {
          ViewChannel: true,
          ReadMessageHistory: true,
          SendMessages: false,
          AddReactions: false,
          Connect: false,
          Speak: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          AttachFiles: false,
          EmbedLinks: false,
          UseExternalEmojis: false,
          UseExternalStickers: false,
          MentionEveryone: false,
          ManageMessages: false,
          ManageThreads: false,
        });
        restored++;
        // Throttle a little for large servers
        if (restored % 10 === 0) await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Failed to restore access for user ${memberId}:`, err);
      }
    }

    status.push(`👁️‍🗨️ Restored view-only access for ${restored} members.`);
    status.push('✅ Channel successfully archived.');
    await interaction.editReply(status.join('\n'));
  },
};

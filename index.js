require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, Events, InteractionType } = require('discord.js');
const axios = require('axios');

// Discord 클라이언트 생성
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 디지몬 데이터 캐시
let digimonData = null;

// 디지몬 데이터 로드 함수
async function loadDigimonData() {
  try {
    const response = await axios.get(process.env.DIGIMON_DATA_URL || 'https://media.dsrwiki.com/data/csv/digimon.json');
    digimonData = response.data;
    console.log('디지몬 데이터 로드 완료!');
  } catch (error) {
    console.error('디지몬 데이터 로드 실패:', error.message);
  }
}

// 디지몬 정보 검색 함수
function searchDigimon(query) {
  if (!digimonData) return null;
  
  // 정확한 이름으로 검색
  if (digimonData[query]) {
    return { name: query, data: digimonData[query] };
  }
  
  // 부분 일치로 검색
  const matches = Object.keys(digimonData).filter(name => 
    name.toLowerCase().includes(query.toLowerCase())
  );
  
  if (matches.length === 1) {
    return { name: matches[0], data: digimonData[matches[0]] };
  } else if (matches.length > 1) {
    return { suggestions: matches };
  }
  
  return null;
}

// 디지몬 정보를 임베드로 변환
function createDigimonEmbed(digimonName, digimonData) {
  const embed = new EmbedBuilder()
    .setTitle(`🦖 ${digimonName}`)
    .setColor(0x00ff00)
    .setTimestamp();
  
  // 기본 정보
  embed.addFields(
    { name: '진화 단계', value: digimonData.evolution_stage, inline: true },
    { name: '타입', value: digimonData.type, inline: true },
    { name: '레벨', value: digimonData.stats.level.toString(), inline: true }
  );
  
  // 스탯 정보
  const stats = digimonData.stats;
  embed.addFields(
    { name: 'HP', value: stats.hp.toString(), inline: true },
    { name: 'SP', value: stats.sp.toString(), inline: true },
    { name: 'STR', value: stats.STR.toString(), inline: true },
    { name: 'INT', value: stats.INT.toString(), inline: true },
    { name: 'DEF', value: stats.DEF.toString(), inline: true },
    { name: 'RES', value: stats.RES.toString(), inline: true },
    { name: 'SPD', value: stats.SPD.toString(), inline: true }
  );
  
  // 강점과 약점
  if (digimonData.strengths) {
    embed.addFields({
      name: '강점',
      value: `${digimonData.strengths.attribute} / ${digimonData.strengths.effect}`,
      inline: true
    });
  }
  
  if (digimonData.weaknesses) {
    embed.addFields({
      name: '약점',
      value: `${digimonData.weaknesses.attribute} / ${digimonData.weaknesses.effect}`,
      inline: true
    });
  }
  
  // 필드
  if (digimonData.fields && digimonData.fields.length > 0) {
    embed.addFields({
      name: '필드',
      value: digimonData.fields.join(', '),
      inline: false
    });
  }
  
  // 스킬 정보
  if (digimonData.skills && digimonData.skills.length > 0) {
    const skillsText = digimonData.skills.map(skill => 
      `**${skill.name}** (${skill.hits}타, ${skill.range}, ${skill.attribute}, ${skill.target_count})`
    ).join('\n');
    
    embed.addFields({
      name: '스킬',
      value: skillsText,
      inline: false
    });
  }
  
  return embed;
}

// 봇이 준비되었을 때
client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} 봇이 준비되었습니다!`);
  
  // 봇 상태 설정 (프로필에 표시됨)
  client.user.setActivity('/도움말 | 디지몬 정보 봇', { type: 'PLAYING' });
  
  loadDigimonData();
});

// 슬래시 명령어 처리
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case '디지몬':
        const digimonName = interaction.options.getString('이름');
        const digimonResult = searchDigimon(digimonName);
        
        if (!digimonResult) {
          await interaction.reply(`'${digimonName}'에 대한 디지몬을 찾을 수 없습니다.`);
          return;
        }
        
        if (digimonResult.suggestions) {
          await interaction.reply(`여러 결과가 있습니다. 다음 중 선택해주세요:\n${digimonResult.suggestions.slice(0, 10).join(', ')}`);
          return;
        }
        
        const embed = createDigimonEmbed(digimonResult.name, digimonResult.data);
        await interaction.reply({ embeds: [embed] });
        break;

      case '약점':
        const weaknessName = interaction.options.getString('이름');
        const weaknessResult = searchDigimon(weaknessName);
        
        if (!weaknessResult || weaknessResult.suggestions) {
          await interaction.reply(`'${weaknessName}'에 대한 디지몬을 찾을 수 없습니다.`);
          return;
        }
        
        const weakness = weaknessResult.data.weaknesses;
        if (weakness) {
          await interaction.reply(`**${weaknessResult.name}**의 약점\n${weakness.attribute} / ${weakness.effect}`);
        } else {
          await interaction.reply(`**${weaknessResult.name}**의 약점 정보가 없습니다.`);
        }
        break;

      case '강점':
        const strengthName = interaction.options.getString('이름');
        const strengthResult = searchDigimon(strengthName);
        
        if (!strengthResult || strengthResult.suggestions) {
          await interaction.reply(`'${strengthName}'에 대한 디지몬을 찾을 수 없습니다.`);
          return;
        }
        
        const strength = strengthResult.data.strengths;
        if (strength) {
          await interaction.reply(`**${strengthResult.name}**의 강점\n${strength.attribute} / ${strength.effect}`);
        } else {
          await interaction.reply(`**${strengthResult.name}**의 강점 정보가 없습니다.`);
        }
        break;

      case '스탯':
        const statsName = interaction.options.getString('이름');
        const statsResult = searchDigimon(statsName);
        
        if (!statsResult || statsResult.suggestions) {
          await interaction.reply(`'${statsName}'에 대한 디지몬을 찾을 수 없습니다.`);
          return;
        }
        
        const stats = statsResult.data.stats;
        const statsText = `**${statsResult.name}**의 스탯\nHP: ${stats.hp}\nSP: ${stats.sp}\nSTR: ${stats.STR}\nINT: ${stats.INT}\nDEF: ${stats.DEF}\nRES: ${stats.RES}\nSPD: ${stats.SPD}`;
        
        await interaction.reply(statsText);
        break;

      case '필드':
        const fieldName = interaction.options.getString('이름');
        const fieldResult = searchDigimon(fieldName);
        
        if (!fieldResult || fieldResult.suggestions) {
          await interaction.reply(`'${fieldName}'에 대한 디지몬을 찾을 수 없습니다.`);
          return;
        }
        
        const fields = fieldResult.data.fields;
        if (fields && fields.length > 0) {
          await interaction.reply(`**${fieldResult.name}**의 필드\n${fields.join(', ')}`);
        } else {
          await interaction.reply(`**${fieldResult.name}**의 필드 정보가 없습니다.`);
        }
        break;

      case '도움말':
        const helpEmbed = new EmbedBuilder()
          .setTitle('🦖 디지몬 봇 도움말')
          .setColor(0x0099ff)
          .setDescription('다음 명령어들을 사용할 수 있습니다:')
                     .addFields(
             { name: '/디지몬 [이름]', value: '디지몬의 전체 정보를 보여줍니다', inline: false },
             { name: '/약점 [이름]', value: '디지몬의 약점을 보여줍니다', inline: false },
             { name: '/강점 [이름]', value: '디지몬의 강점을 보여줍니다', inline: false },
             { name: '/스탯 [이름]', value: '디지몬의 스탯을 보여줍니다', inline: false },
             { name: '/필드 [이름]', value: '디지몬의 필드를 보여줍니다', inline: false },
             { name: '/도움말', value: '이 도움말을 보여줍니다', inline: false }
           )
          .setFooter({ text: '예시: /디지몬 가지몬, /약점 가지몬' });
        
        await interaction.reply({ embeds: [helpEmbed] });
        break;
    }
  } catch (error) {
    console.error('명령어 처리 중 오류 발생:', error);
    await interaction.reply({ content: '명령어 처리 중 오류가 발생했습니다.', ephemeral: true });
  }
});

// 기존 메시지 명령어도 지원 (하위 호환성)
client.on(Events.MessageCreate, async (message) => {
  // 봇 메시지 무시
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // 디지몬 정보 검색 명령어
  if (content.startsWith('!디지몬') || content.startsWith('!digimon')) {
    const query = message.content.slice(content.startsWith('!디지몬') ? 4 : 9).trim();
    
    if (!query) {
      message.reply('사용법: `!디지몬 [디지몬 이름]` 또는 `!digimon [디지몬 이름]`');
      return;
    }
    
    const result = searchDigimon(query);
    
    if (!result) {
      message.reply(`'${query}'에 대한 디지몬을 찾을 수 없습니다.`);
      return;
    }
    
    if (result.suggestions) {
      message.reply(`여러 결과가 있습니다. 다음 중 선택해주세요:\n${result.suggestions.slice(0, 10).join(', ')}`);
      return;
    }
    
    const embed = createDigimonEmbed(result.name, result.data);
    message.reply({ embeds: [embed] });
  }
  
  // 특정 정보 검색 명령어들
  else if (content.startsWith('!약점') || content.startsWith('!weakness')) {
    const query = message.content.slice(content.startsWith('!약점') ? 3 : 10).trim();
    
    if (!query) {
      message.reply('사용법: `!약점 [디지몬 이름]` 또는 `!weakness [디지몬 이름]`');
      return;
    }
    
    const result = searchDigimon(query);
    
    if (!result || result.suggestions) {
      message.reply(`'${query}'에 대한 디지몬을 찾을 수 없습니다.`);
      return;
    }
    
                         const weakness = result.data.weaknesses;
         if (weakness) {
           message.reply(`**${result.name}**의 약점\n${weakness.attribute} / ${weakness.effect}`);
         } else {
           message.reply(`**${result.name}**의 약점 정보가 없습니다.`);
         }
  }
  
  else if (content.startsWith('!강점') || content.startsWith('!strength')) {
    const query = message.content.slice(content.startsWith('!강점') ? 3 : 10).trim();
    
    if (!query) {
      message.reply('사용법: `!강점 [디지몬 이름]` 또는 `!strength [디지몬 이름]`');
      return;
    }
    
    const result = searchDigimon(query);
    
    if (!result || result.suggestions) {
      message.reply(`'${query}'에 대한 디지몬을 찾을 수 없습니다.`);
      return;
    }
    
                         const strength = result.data.strengths;
         if (strength) {
           message.reply(`**${result.name}**의 강점\n${strength.attribute} / ${strength.effect}`);
         } else {
           message.reply(`**${result.name}**의 강점 정보가 없습니다.`);
         }
  }
  
  else if (content.startsWith('!스탯') || content.startsWith('!stats')) {
    const query = message.content.slice(content.startsWith('!스탯') ? 3 : 6).trim();
    
    if (!query) {
      message.reply('사용법: `!스탯 [디지몬 이름]` 또는 `!stats [디지몬 이름]`');
      return;
    }
    
    const result = searchDigimon(query);
    
    if (!result || result.suggestions) {
      message.reply(`'${query}'에 대한 디지몬을 찾을 수 없습니다.`);
      return;
    }
    
                                                                                                                                                           const stats = result.data.stats;
           const statsText = `**${result.name}**의 스탯\nHP: ${stats.hp}\nSP: ${stats.sp}\nSTR: ${stats.STR}\nINT: ${stats.INT}\nDEF: ${stats.DEF}\nRES: ${stats.RES}\nSPD: ${stats.SPD}`;
           
           message.reply(statsText);
   }
   
   // 필드 명령어
   else if (content.startsWith('!필드') || content.startsWith('!field')) {
     const query = message.content.slice(content.startsWith('!필드') ? 3 : 7).trim();
     
     if (!query) {
       message.reply('사용법: `!필드 [디지몬 이름]` 또는 `!field [디지몬 이름]`');
       return;
     }
     
     const result = searchDigimon(query);
     
     if (!result || result.suggestions) {
       message.reply(`'${query}'에 대한 디지몬을 찾을 수 없습니다.`);
       return;
     }
     
     const digimonFields = result.data.fields;
     if (digimonFields && digimonFields.length > 0) {
       message.reply(`**${result.name}**의 필드\n${digimonFields.join(', ')}`);
     } else {
       message.reply(`**${result.name}**의 필드 정보가 없습니다.`);
     }
   }
   
   // 도움말
  else if (content === '!도움말' || content === '!help') {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🦖 DSRWIKI 봇')
      .setColor(0x0099ff)
      .setDescription('다음 명령어들을 사용할 수 있습니다:')
             .addFields(
         { name: '/디지몬 [이름]', value: '디지몬의 전체 정보를 보여줍니다', inline: false },
         { name: '/약점 [이름]', value: '디지몬의 약점을 보여줍니다', inline: false },
         { name: '/강점 [이름]', value: '디지몬의 강점을 보여줍니다', inline: false },
         { name: '/스탯 [이름]', value: '디지몬의 스탯을 보여줍니다', inline: false },
         { name: '/필드 [이름]', value: '디지몬의 필드를 보여줍니다', inline: false },
       )
      .setFooter({ text: '예시: /디지몬 가지몬, /약점 가지몬' });
    
    message.reply({ embeds: [helpEmbed] });
  }
});

// 에러 처리
client.on('error', error => {
  console.error('Discord 클라이언트 에러:', error);
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);

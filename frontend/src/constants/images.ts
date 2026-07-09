import type { Line, TierName } from '../types';

import challenger from '../assets/tier_img/challenger.webp';
import grandmaster from '../assets/tier_img/grandmaster.webp';
import master from '../assets/tier_img/master.webp';
import diamond from '../assets/tier_img/diamond.webp';
import emerald from '../assets/tier_img/emerald.webp';
import platinum from '../assets/tier_img/platinum.webp';
import gold from '../assets/tier_img/gold.webp';
import silver from '../assets/tier_img/silver.webp';
import bronze from '../assets/tier_img/bronze.webp';
import iron from '../assets/tier_img/iron.webp';

import top from '../assets/line_img/top.svg';
import jgl from '../assets/line_img/jgl.svg';
import mid from '../assets/line_img/mid.svg';
import bot from '../assets/line_img/bot.webp';
import spt from '../assets/line_img/spt.svg';

export const TIER_IMG: Record<TierName, string> = {
  CHALLENGER: challenger,
  GRANDMASTER: grandmaster,
  MASTER: master,
  DIAMOND: diamond,
  EMERALD: emerald,
  PLATINUM: platinum,
  GOLD: gold,
  SILVER: silver,
  BRONZE: bronze,
  IRON: iron,
};

export const LINE_IMG: Record<Line, string> = {
  TOP: top,
  JGL: jgl,
  MID: mid,
  BOT: bot,
  SPT: spt,
};

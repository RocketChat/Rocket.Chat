import { ABRPresets } from './ABRPresets';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { Quality } from './Quality';
import { VBRPresets } from './VBRPresets';
import { VbrMode } from './VbrMode';

const enum Preset {
  V9 = 410,
  V8 = 420,
  V7 = 430,
  V6 = 440,
  V5 = 450,
  V4 = 460,
  V3 = 470,
  V2 = 480,
  V1 = 490,
  V0 = 500,
  R3MIX = 1000,
  STANDARD = 1001,
  EXTREME = 1002,
  INSANE = 1003,
  STANDARD_FAST = 1004,
  EXTREME_FAST = 1005,
  MEDIUM = 1006,
  MEDIUM_FAST = 1007,
}

export class Presets {
  private readonly vbrPresets = new VBRPresets();

  public readonly abrPresets = new ABRPresets();

  apply(gfp: LameGlobalFlags, preset: Preset) {
    switch (preset) {
      case Preset.R3MIX: {
        preset = Preset.V3;
        gfp.VBR = VbrMode.vbr_mtrh;
        break;
      }
      case Preset.MEDIUM: {
        preset = Preset.V4;
        gfp.VBR = VbrMode.vbr_rh;
        break;
      }
      case Preset.MEDIUM_FAST: {
        preset = Preset.V4;
        gfp.VBR = VbrMode.vbr_mtrh;
        break;
      }
      case Preset.STANDARD: {
        preset = Preset.V2;
        gfp.VBR = VbrMode.vbr_rh;
        break;
      }
      case Preset.STANDARD_FAST: {
        preset = Preset.V2;
        gfp.VBR = VbrMode.vbr_mtrh;
        break;
      }
      case Preset.EXTREME: {
        preset = Preset.V0;
        gfp.VBR = VbrMode.vbr_rh;
        break;
      }
      case Preset.EXTREME_FAST: {
        preset = Preset.V0;
        gfp.VBR = VbrMode.vbr_mtrh;
        break;
      }
      case Preset.INSANE: {
        gfp.preset = 320;
        gfp.VBR = VbrMode.vbr_off;
        this.abrPresets.apply(gfp, 320);
        return 320;
      }
    }

    gfp.preset = preset;

    switch (preset) {
      case Preset.V9:
        this.vbrPresets.apply(gfp, 9);
        return preset;
      case Preset.V8:
        this.vbrPresets.apply(gfp, 8);
        return preset;
      case Preset.V7:
        this.vbrPresets.apply(gfp, 7);
        return preset;
      case Preset.V6:
        this.vbrPresets.apply(gfp, 6);
        return preset;
      case Preset.V5:
        this.vbrPresets.apply(gfp, 5);
        return preset;
      case Preset.V4:
        this.vbrPresets.apply(gfp, 4);
        return preset;
      case Preset.V3:
        this.vbrPresets.apply(gfp, 3);
        return preset;
      case Preset.V2:
        this.vbrPresets.apply(gfp, 2);
        return preset;
      case Preset.V1:
        this.vbrPresets.apply(gfp, 1);
        return preset;
      case Preset.V0:
        this.vbrPresets.apply(gfp, 0);
        return preset;
      default:
        break;
    }

    if (preset >= 8 && preset <= 320) {
      return this.abrPresets.apply(gfp, preset);
    }

    gfp.preset = 0;
    return preset;
  }

  applyPresetFromQuality(gfp: LameGlobalFlags, quality: Quality) {
    return this.apply(gfp, 500 - 10 * quality);
  }
}

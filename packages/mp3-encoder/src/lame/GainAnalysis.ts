import type { ReplayGain } from './ReplayGain';
import { copyArray, fillArray } from './arrays';
import { fsqr } from './math';

export class GainAnalysis {
  static readonly STEPS_per_dB = 100;

  static readonly MAX_dB = 120;

  static readonly GAIN_NOT_ENOUGH_SAMPLES = -24601;

  static readonly GAIN_ANALYSIS_ERROR = 0;

  static readonly GAIN_ANALYSIS_OK = 1;

  static readonly INIT_GAIN_ANALYSIS_ERROR = 0;

  static readonly INIT_GAIN_ANALYSIS_OK = 1;

  static readonly YULE_ORDER = 10;

  static readonly MAX_ORDER = GainAnalysis.YULE_ORDER;

  static readonly MAX_SAMP_FREQ = 48000;

  static readonly RMS_WINDOW_TIME_NUMERATOR = 1;

  static readonly RMS_WINDOW_TIME_DENOMINATOR = 20;

  static readonly MAX_SAMPLES_PER_WINDOW =
    (GainAnalysis.MAX_SAMP_FREQ * GainAnalysis.RMS_WINDOW_TIME_NUMERATOR) /
      GainAnalysis.RMS_WINDOW_TIME_DENOMINATOR +
    1;

  private static readonly PINK_REF = 64.82;

  private static readonly RMS_PERCENTILE = 0.95;

  private ABYule = [
    [
      0.038575994352, -3.84664617118067, -0.02160367184185, 7.81501653005538,
      -0.00123395316851, -11.34170355132042, -0.00009291677959,
      13.05504219327545, -0.01655260341619, -12.28759895145294,
      0.02161526843274, 9.4829380631979, -0.02074045215285, -5.87257861775999,
      0.00594298065125, 2.75465861874613, 0.00306428023191, -0.86984376593551,
      0.00012025322027, 0.13919314567432, 0.00288463683916,
    ],
    [
      0.0541865640643, -3.47845948550071, -0.02911007808948, 6.36317777566148,
      -0.00848709379851, -8.54751527471874, -0.00851165645469, 9.4769360780128,
      -0.00834990904936, -8.81498681370155, 0.02245293253339, 6.85401540936998,
      -0.02596338512915, -4.39470996079559, 0.01624864962975, 2.19611684890774,
      -0.00240879051584, -0.75104302451432, 0.00674613682247, 0.13149317958808,
      -0.00187763777362,
    ],
    [
      0.15457299681924, -2.37898834973084, -0.09331049056315, 2.84868151156327,
      -0.06247880153653, -2.64577170229825, 0.02163541888798, 2.23697657451713,
      -0.05588393329856, -1.67148153367602, 0.04781476674921, 1.00595954808547,
      0.00222312597743, -0.45953458054983, 0.03174092540049, 0.16378164858596,
      -0.01390589421898, -0.05032077717131, 0.00651420667831, 0.0234789740702,
      -0.00881362733839,
    ],
    [
      0.30296907319327, -1.61273165137247, -0.22613988682123, 1.0797749225997,
      -0.08587323730772, -0.2565625775407, 0.03282930172664, -0.1627671912044,
      -0.00915702933434, -0.22638893773906, -0.02364141202522, 0.39120800788284,
      -0.00584456039913, -0.22138138954925, 0.06276101321749, 0.04500235387352,
      -0.00000828086748, 0.02005851806501, 0.00205861885564, 0.00302439095741,
      -0.02950134983287,
    ],
    [
      0.33642304856132, -1.49858979367799, -0.2557224142557, 0.87350271418188,
      -0.11828570177555, 0.12205022308084, 0.11921148675203, -0.80774944671438,
      -0.07834489609479, 0.47854794562326, -0.0046997791438, -0.12453458140019,
      -0.0058950022444, -0.04067510197014, 0.05724228140351, 0.08333755284107,
      0.00832043980773, -0.04237348025746, -0.0163538138454, 0.02977207319925,
      -0.0176017656815,
    ],
    [
      0.4491525660845, -0.62820619233671, -0.14351757464547, 0.29661783706366,
      -0.22784394429749, -0.372563729424, -0.01419140100551, 0.00213767857124,
      0.04078262797139, -0.42029820170918, -0.12398163381748, 0.22199650564824,
      0.04097565135648, 0.00613424350682, 0.10478503600251, 0.06747620744683,
      -0.01863887810927, 0.05784820375801, -0.03193428438915, 0.03222754072173,
      0.00541907748707,
    ],
    [
      0.56619470757641, -1.04800335126349, -0.75464456939302, 0.29156311971249,
      0.1624213774223, -0.26806001042947, 0.16744243493672, 0.00819999645858,
      -0.18901604199609, 0.45054734505008, 0.3093178284183, -0.33032403314006,
      -0.27562961986224, 0.0673936833311, 0.00647310677246, -0.04784254229033,
      0.08647503780351, 0.01639907836189, -0.0378898455484, 0.01807364323573,
      -0.00588215443421,
    ],
    [
      0.58100494960553, -0.51035327095184, -0.53174909058578, -0.31863563325245,
      -0.14289799034253, -0.20256413484477, 0.17520704835522, 0.1472815413433,
      0.02377945217615, 0.38952639978999, 0.15558449135573, -0.23313271880868,
      -0.25344790059353, -0.05246019024463, 0.01628462406333, -0.02505961724053,
      0.06920467763959, 0.02442357316099, -0.03721611395801, 0.01818801111503,
      -0.00749618797172,
    ],
    [
      0.53648789255105, -0.2504987195602, -0.42163034350696, -0.43193942311114,
      -0.00275953611929, -0.03424681017675, 0.04267842219415, -0.04678328784242,
      -0.10214864179676, 0.26408300200955, 0.14590772289388, 0.15113130533216,
      -0.02459864859345, -0.17556493366449, -0.11202315195388,
      -0.18823009262115, -0.04060034127, 0.05477720428674, 0.0478866554818,
      0.0470440968812, -0.02217936801134,
    ],
  ];

  private ABButter = [
    [
      0.98621192462708, -1.97223372919527, -1.97242384925416, 0.97261396931306,
      0.98621192462708,
    ],
    [
      0.98500175787242, -1.96977855582618, -1.97000351574484, 0.9702284756635,
      0.98500175787242,
    ],
    [
      0.97938932735214, -1.95835380975398, -1.95877865470428, 0.95920349965459,
      0.97938932735214,
    ],
    [
      0.97531843204928, -1.95002759149878, -1.95063686409857, 0.95124613669835,
      0.97531843204928,
    ],
    [
      0.97316523498161, -1.94561023566527, -1.94633046996323, 0.94705070426118,
      0.97316523498161,
    ],
    [
      0.96454515552826, -1.92783286977036, -1.92909031105652, 0.93034775234268,
      0.96454515552826,
    ],
    [
      0.96009142950541, -1.91858953033784, -1.92018285901082, 0.92177618768381,
      0.96009142950541,
    ],
    [
      0.95856916599601, -1.9154210807478, -1.91713833199203, 0.91885558323625,
      0.95856916599601,
    ],
    [
      0.94597685600279, -1.88903307939452, -1.89195371200558, 0.89487434461664,
      0.94597685600279,
    ],
  ];

  private filterYule(
    input: Float32Array,
    inputPos: number,
    output: Float32Array,
    outputPos: number,
    nSamples: number,
    kernel: number[],
  ): void {
    while (nSamples-- !== 0) {
      output[outputPos] =
        1e-10 +
        input[inputPos + 0] * kernel[0] -
        output[outputPos - 1] * kernel[1] +
        input[inputPos - 1] * kernel[2] -
        output[outputPos - 2] * kernel[3] +
        input[inputPos - 2] * kernel[4] -
        output[outputPos - 3] * kernel[5] +
        input[inputPos - 3] * kernel[6] -
        output[outputPos - 4] * kernel[7] +
        input[inputPos - 4] * kernel[8] -
        output[outputPos - 5] * kernel[9] +
        input[inputPos - 5] * kernel[10] -
        output[outputPos - 6] * kernel[11] +
        input[inputPos - 6] * kernel[12] -
        output[outputPos - 7] * kernel[13] +
        input[inputPos - 7] * kernel[14] -
        output[outputPos - 8] * kernel[15] +
        input[inputPos - 8] * kernel[16] -
        output[outputPos - 9] * kernel[17] +
        input[inputPos - 9] * kernel[18] -
        output[outputPos - 10] * kernel[19] +
        input[inputPos - 10] * kernel[20];
      ++outputPos;
      ++inputPos;
    }
  }

  private filterButter(
    input: Float32Array,
    inputPos: number,
    output: Float32Array,
    outputPos: number,
    nSamples: number,
    kernel: number[],
  ) {
    while (nSamples-- !== 0) {
      output[outputPos] =
        input[inputPos + 0] * kernel[0] -
        output[outputPos - 1] * kernel[1] +
        input[inputPos - 1] * kernel[2] -
        output[outputPos - 2] * kernel[3] +
        input[inputPos - 2] * kernel[4];
      ++outputPos;
      ++inputPos;
    }
  }

  private resetSampleFrequency(rgData: ReplayGain, samplefreq: number) {
    for (let i = 0; i < GainAnalysis.MAX_ORDER; i++) {
      rgData.linprebuf[i] = 0;
      rgData.lstepbuf[i] = 0;
      rgData.loutbuf[i] = 0;
      rgData.rinprebuf[i] = 0;
      rgData.rstepbuf[i] = 0;
      rgData.routbuf[i] = 0;
    }

    switch (Math.trunc(samplefreq)) {
      case 48000:
        rgData.reqindex = 0;
        break;
      case 44100:
        rgData.reqindex = 1;
        break;
      case 32000:
        rgData.reqindex = 2;
        break;
      case 24000:
        rgData.reqindex = 3;
        break;
      case 22050:
        rgData.reqindex = 4;
        break;
      case 16000:
        rgData.reqindex = 5;
        break;
      case 12000:
        rgData.reqindex = 6;
        break;
      case 11025:
        rgData.reqindex = 7;
        break;
      case 8000:
        rgData.reqindex = 8;
        break;
      default:
        return GainAnalysis.INIT_GAIN_ANALYSIS_ERROR;
    }

    rgData.sampleWindow = Math.trunc(
      (samplefreq * GainAnalysis.RMS_WINDOW_TIME_NUMERATOR +
        GainAnalysis.RMS_WINDOW_TIME_DENOMINATOR -
        1) /
        GainAnalysis.RMS_WINDOW_TIME_DENOMINATOR,
    );

    rgData.lsum = 0;
    rgData.rsum = 0;
    rgData.totsamp = 0;

    fillArray(rgData.A, 0);

    return GainAnalysis.INIT_GAIN_ANALYSIS_OK;
  }

  initGainAnalysis(rgData: ReplayGain, samplefreq: number) {
    if (
      this.resetSampleFrequency(rgData, samplefreq) !==
      GainAnalysis.INIT_GAIN_ANALYSIS_OK
    ) {
      return GainAnalysis.INIT_GAIN_ANALYSIS_ERROR;
    }

    rgData.linpre = GainAnalysis.MAX_ORDER;
    rgData.rinpre = GainAnalysis.MAX_ORDER;
    rgData.lstep = GainAnalysis.MAX_ORDER;
    rgData.rstep = GainAnalysis.MAX_ORDER;
    rgData.lout = GainAnalysis.MAX_ORDER;
    rgData.rout = GainAnalysis.MAX_ORDER;

    fillArray(rgData.B, 0);

    return GainAnalysis.INIT_GAIN_ANALYSIS_OK;
  }

  analyzeSamples(
    rgData: ReplayGain,
    left_samples: Float32Array,
    left_samplesPos: number,
    right_samples: Float32Array,
    right_samplesPos: number,
    num_samples: number,
    num_channels: number,
  ) {
    let curleft;
    let curleftBase;
    let curright;
    let currightBase;
    let batchsamples;
    let cursamples;
    let cursamplepos;

    if (num_samples === 0) return GainAnalysis.GAIN_ANALYSIS_OK;

    cursamplepos = 0;
    batchsamples = num_samples;

    switch (num_channels) {
      case 1:
        right_samples = left_samples;
        right_samplesPos = left_samplesPos;
        break;
      case 2:
        break;
      default:
        return GainAnalysis.GAIN_ANALYSIS_ERROR;
    }

    if (num_samples < GainAnalysis.MAX_ORDER) {
      copyArray(
        left_samples,
        left_samplesPos,
        rgData.linprebuf,
        GainAnalysis.MAX_ORDER,
        num_samples,
      );
      copyArray(
        right_samples,
        right_samplesPos,
        rgData.rinprebuf,
        GainAnalysis.MAX_ORDER,
        num_samples,
      );
    } else {
      copyArray(
        left_samples,
        left_samplesPos,
        rgData.linprebuf,
        GainAnalysis.MAX_ORDER,
        GainAnalysis.MAX_ORDER,
      );
      copyArray(
        right_samples,
        right_samplesPos,
        rgData.rinprebuf,
        GainAnalysis.MAX_ORDER,
        GainAnalysis.MAX_ORDER,
      );
    }

    while (batchsamples > 0) {
      cursamples =
        batchsamples > rgData.sampleWindow - rgData.totsamp
          ? rgData.sampleWindow - rgData.totsamp
          : batchsamples;
      if (cursamplepos < GainAnalysis.MAX_ORDER) {
        curleft = rgData.linpre + cursamplepos;
        curleftBase = rgData.linprebuf;
        curright = rgData.rinpre + cursamplepos;
        currightBase = rgData.rinprebuf;
        if (cursamples > GainAnalysis.MAX_ORDER - cursamplepos)
          cursamples = GainAnalysis.MAX_ORDER - cursamplepos;
      } else {
        curleft = left_samplesPos + cursamplepos;
        curleftBase = left_samples;
        curright = right_samplesPos + cursamplepos;
        currightBase = right_samples;
      }

      this.filterYule(
        curleftBase,
        curleft,
        rgData.lstepbuf,
        rgData.lstep + rgData.totsamp,
        cursamples,
        this.ABYule[rgData.reqindex],
      );
      this.filterYule(
        currightBase,
        curright,
        rgData.rstepbuf,
        rgData.rstep + rgData.totsamp,
        cursamples,
        this.ABYule[rgData.reqindex],
      );

      this.filterButter(
        rgData.lstepbuf,
        rgData.lstep + rgData.totsamp,
        rgData.loutbuf,
        rgData.lout + rgData.totsamp,
        cursamples,
        this.ABButter[rgData.reqindex],
      );
      this.filterButter(
        rgData.rstepbuf,
        rgData.rstep + rgData.totsamp,
        rgData.routbuf,
        rgData.rout + rgData.totsamp,
        cursamples,
        this.ABButter[rgData.reqindex],
      );

      curleft = rgData.lout + rgData.totsamp;

      curleftBase = rgData.loutbuf;
      curright = rgData.rout + rgData.totsamp;
      currightBase = rgData.routbuf;

      let i = cursamples % 8;
      while (i-- !== 0) {
        rgData.lsum += fsqr(curleftBase[curleft++]);
        rgData.rsum += fsqr(currightBase[curright++]);
      }
      i = cursamples / 8;
      while (i-- !== 0) {
        rgData.lsum +=
          fsqr(curleftBase[curleft + 0]) +
          fsqr(curleftBase[curleft + 1]) +
          fsqr(curleftBase[curleft + 2]) +
          fsqr(curleftBase[curleft + 3]) +
          fsqr(curleftBase[curleft + 4]) +
          fsqr(curleftBase[curleft + 5]) +
          fsqr(curleftBase[curleft + 6]) +
          fsqr(curleftBase[curleft + 7]);
        curleft += 8;
        rgData.rsum +=
          fsqr(currightBase[curright + 0]) +
          fsqr(currightBase[curright + 1]) +
          fsqr(currightBase[curright + 2]) +
          fsqr(currightBase[curright + 3]) +
          fsqr(currightBase[curright + 4]) +
          fsqr(currightBase[curright + 5]) +
          fsqr(currightBase[curright + 6]) +
          fsqr(currightBase[curright + 7]);
        curright += 8;
      }

      batchsamples -= cursamples;
      cursamplepos += cursamples;
      rgData.totsamp += cursamples;
      if (rgData.totsamp === rgData.sampleWindow) {
        const val =
          GainAnalysis.STEPS_per_dB *
          10 *
          Math.log10(
            ((rgData.lsum + rgData.rsum) / rgData.totsamp) * 0.5 + 1e-37,
          );
        let ival = val <= 0 ? 0 : Math.trunc(val);
        if (ival >= rgData.A.length) ival = rgData.A.length - 1;
        rgData.A[ival]++;
        rgData.lsum = 0;
        rgData.rsum = 0;

        copyArray(
          rgData.loutbuf,
          rgData.totsamp,
          rgData.loutbuf,
          0,
          GainAnalysis.MAX_ORDER,
        );
        copyArray(
          rgData.routbuf,
          rgData.totsamp,
          rgData.routbuf,
          0,
          GainAnalysis.MAX_ORDER,
        );
        copyArray(
          rgData.lstepbuf,
          rgData.totsamp,
          rgData.lstepbuf,
          0,
          GainAnalysis.MAX_ORDER,
        );
        copyArray(
          rgData.rstepbuf,
          rgData.totsamp,
          rgData.rstepbuf,
          0,
          GainAnalysis.MAX_ORDER,
        );
        rgData.totsamp = 0;
      }
      if (rgData.totsamp > rgData.sampleWindow) {
        return GainAnalysis.GAIN_ANALYSIS_ERROR;
      }
    }
    if (num_samples < GainAnalysis.MAX_ORDER) {
      copyArray(
        rgData.linprebuf,
        num_samples,
        rgData.linprebuf,
        0,
        GainAnalysis.MAX_ORDER - num_samples,
      );
      copyArray(
        rgData.rinprebuf,
        num_samples,
        rgData.rinprebuf,
        0,
        GainAnalysis.MAX_ORDER - num_samples,
      );
      copyArray(
        left_samples,
        left_samplesPos,
        rgData.linprebuf,
        GainAnalysis.MAX_ORDER - num_samples,
        num_samples,
      );
      copyArray(
        right_samples,
        right_samplesPos,
        rgData.rinprebuf,
        GainAnalysis.MAX_ORDER - num_samples,
        num_samples,
      );
    } else {
      copyArray(
        left_samples,
        left_samplesPos + num_samples - GainAnalysis.MAX_ORDER,
        rgData.linprebuf,
        0,
        GainAnalysis.MAX_ORDER,
      );
      copyArray(
        right_samples,
        right_samplesPos + num_samples - GainAnalysis.MAX_ORDER,
        rgData.rinprebuf,
        0,
        GainAnalysis.MAX_ORDER,
      );
    }

    return GainAnalysis.GAIN_ANALYSIS_OK;
  }

  private analyzeResult(Array: Int32Array, len: number) {
    let i;

    let elems = 0;
    for (i = 0; i < len; i++) elems += Array[i];
    if (elems === 0) return GainAnalysis.GAIN_NOT_ENOUGH_SAMPLES;

    let upper = Math.ceil(elems * (1 - GainAnalysis.RMS_PERCENTILE));
    for (i = len; i-- > 0; ) {
      if ((upper -= Array[i]) <= 0) break;
    }

    return GainAnalysis.PINK_REF - i / GainAnalysis.STEPS_per_dB;
  }

  getTitleGain(rgData: ReplayGain) {
    const retval = this.analyzeResult(rgData.A, rgData.A.length);

    for (let i = 0; i < rgData.A.length; i++) {
      rgData.B[i] += rgData.A[i];
      rgData.A[i] = 0;
    }

    for (let i = 0; i < GainAnalysis.MAX_ORDER; i++) {
      rgData.linprebuf[i] = 0;
      rgData.lstepbuf[i] = 0;
      rgData.loutbuf[i] = 0;
      rgData.rinprebuf[i] = 0;
      rgData.rstepbuf[i] = 0;
      rgData.routbuf[i] = 0;
    }

    rgData.totsamp = 0;
    rgData.lsum = 0;
    rgData.rsum = 0;
    return retval;
  }
}

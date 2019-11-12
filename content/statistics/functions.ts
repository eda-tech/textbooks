// =============================================================================
// Statistics
// (c) Mathigon
// =============================================================================


import {InputView} from '@mathigon/boost';
import {last, total} from '@mathigon/core';
import {clamp, Random, roundTo} from '@mathigon/fermat';
import {rotateDisk} from '../shared/components/disk';
import {Step} from '../shared/types';


export function roulette($step: Step) {
  const $wheels = $step.$$('.wheel');
  const $ball = $step.$('.ball')!;
  const $target = $step.$('circle')!;

  let ballSpeed: number;
  let ballAngle: number;
  let ballOffset: number;

  rotateDisk($target, {
    $disk: $wheels[0],
    start() {
      $ball.hide();
      $step.score('rotate');
    },
    momentumStart(speed) {
      $ball.show();
      ballSpeed = -0.8 * speed;
      ballAngle = 0;
      ballOffset = 0;
    },
    draw(angle, isMomentum, dt) {
      for (let $w of $wheels) $w.setTransform(undefined, angle);
      if (!isMomentum) return;

      ballSpeed *= 0.985;
      if (Math.abs(ballSpeed) > 0.00032) {
        ballAngle = (ballAngle + dt * ballSpeed) % (2 * Math.PI);
      } else {
        if (!ballOffset) ballOffset =
            roundTo(ballAngle - angle, 2 * Math.PI / 37);
        ballAngle = angle + ballOffset;
      }

      const ballRadius = Math.min(116 + 87500 * Math.abs(ballSpeed), 165);
      const x = ballRadius * Math.sin(ballAngle);
      const y = -ballRadius * Math.cos(ballAngle);
      $ball.translate(x, y);
    }
  });
}

// -----------------------------------------------------------------------------

function generatePossibilities(len: number): string[][] {
  if (len <= 1) return [['R', 'B']];
  const prev = generatePossibilities(len - 1);
  return [...prev, last(prev).map(x => x + 'R'), last(prev).map(x => x + 'B')];
}

function findCount(str: string, substr: string) {
  let count = 0;
  for (let i = 0; i <= str.length - substr.length; ++i) {
    if (str.slice(i).startsWith(substr)) count += 1;
  }
  return count;
}

function compute(str: string) {
  const max = clamp(Math.floor(str.length / 2), 1, 8);
  const poss = generatePossibilities(max);
  let result = 1;

  for (let i = 2; i <= max; ++i) {
    let values = poss[i - 1];
    let count = values.length;

    let observed = values.map(v => findCount(str, v));
    let sum = total(observed);

    let chi = total(observed.map(o => (o - sum / count) ** 2 / sum * count));
    let deg = count - 1;

    result = Math.min(result, Random.chiCDF(chi, deg));
  }

  return clamp(result, 0, 1);
}

export function randomSequence($step: Step) {
  const $score = $step.$('.score')!;
  const $input = $step.$('input') as InputView;

  $input.change(str => {
    if (str.length > 7) $step.score('random');
    $score.text = '' + Math.round(compute(str.toUpperCase()) * 100);
  });
}

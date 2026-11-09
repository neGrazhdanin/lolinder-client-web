import { describe, expect, it } from 'vitest';
import { parseMarkup } from '../markup';

describe('parseMarkup', () => {
  it('maps Data Dragon tags to tones and blocks', () => {
    expect(
      parseMarkup(
        '<mainText><stats><attention>130</attention> Ability Power</stats><br><br><passive>Opus</passive><br>Increases <scaleAP>AP by 30%</scaleAP>.</mainText>',
      ),
    ).toEqual([
      {
        type: 'stats',
        children: [
          { type: 'span', tone: 'value', children: [{ type: 'text', text: '130' }] },
          { type: 'text', text: ' Ability Power' },
        ],
      },
      { type: 'span', tone: 'name', children: [{ type: 'text', text: 'Opus' }] },
      { type: 'break' },
      { type: 'text', text: 'Increases ' },
      { type: 'span', tone: 'ap', children: [{ type: 'text', text: 'AP by 30%' }] },
      { type: 'text', text: '.' },
    ]);
  });

  it('keeps only the text of unknown tags and never builds elements from them', () => {
    expect(
      parseMarkup(
        "<lol-uikit-tooltipped-keyword key='x'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> <img src=x onerror=alert(1)><script>alert(1)</script>",
      ),
    ).toEqual([
      { type: 'text', text: 'adaptive' },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'alert(1)' },
    ]);
  });

  it('turns unclosed <li> into bullets and drops empty stats and padding breaks', () => {
    expect(parseMarkup('<stats></stats><br><br>Lead<br><li>One<li>Two<br><br><br>Tail')).toEqual([
      { type: 'text', text: 'Lead' },
      { type: 'bullet', children: [{ type: 'text', text: 'One' }] },
      {
        type: 'bullet',
        children: [
          { type: 'text', text: 'Two' },
          { type: 'break' },
          { type: 'break' },
          { type: 'text', text: 'Tail' },
        ],
      },
    ]);
  });

  it('returns nothing for an empty description', () => {
    expect(parseMarkup('')).toEqual([]);
  });
});

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HintRow } from '@/components/hint-row';

describe('Core UI Components', () => {
  describe('ThemedText', () => {
    it('renders default text variant', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<ThemedText>Test Message</ThemedText>);
      });
      expect(renderer!.root).toBeTruthy();
    });

    it('renders with title and subtitle types', () => {
      let rendererTitle: ReactTestRenderer.ReactTestRenderer;
      let rendererSubtitle: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        rendererTitle = ReactTestRenderer.create(<ThemedText type="title">Header</ThemedText>);
        rendererSubtitle = ReactTestRenderer.create(<ThemedText type="subtitle">Subheader</ThemedText>);
      });
      expect(rendererTitle!.root).toBeTruthy();
      expect(rendererSubtitle!.root).toBeTruthy();
    });

    it('renders with small, link, and code types', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <>
            <ThemedText type="small">Small</ThemedText>
            <ThemedText type="smallBold">Small Bold</ThemedText>
            <ThemedText type="link">Link</ThemedText>
            <ThemedText type="code">Code</ThemedText>
          </>
        );
      });
      expect(renderer!.root).toBeTruthy();
    });
  });

  describe('ThemedView', () => {
    it('renders default container without crashing', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <ThemedView>
            <ThemedText>Inner Content</ThemedText>
          </ThemedView>
        );
      });
      expect(renderer!.root).toBeTruthy();
    });

    it('renders with specific background types', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <ThemedView type="backgroundElement">
            <ThemedText>Element</ThemedText>
          </ThemedView>
        );
      });
      expect(renderer!.root).toBeTruthy();
    });
  });

  describe('HintRow', () => {
    it('renders default hint row', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<HintRow />);
      });
      expect(renderer!.root).toBeTruthy();
    });

    it('renders custom title and hint value', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<HintRow title="Quick Tip" hint="Track daily" />);
      });
      expect(renderer!.root).toBeTruthy();
    });
  });
});

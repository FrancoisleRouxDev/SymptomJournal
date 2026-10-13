import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  SkeletonBox,
  HomeScreenSkeleton,
  InsightsScreenSkeleton,
  TimelineScreenSkeleton,
  SummaryScreenSkeleton,
} from '@/components/SkeletonLoader';

describe('SkeletonLoader Components (src/components/SkeletonLoader.tsx)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('SkeletonBox', () => {
    it('renders with default props without crashing', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<SkeletonBox />);
      });
      expect(renderer!.root).toBeTruthy();
      act(() => {
        renderer.unmount();
      });
    });

    it('renders with custom height, width, and borderRadius', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <SkeletonBox width={150} height={30} borderRadius={15} style={{ margin: 8 }} />
        );
      });
      expect(renderer!.root).toBeTruthy();
      act(() => {
        renderer.unmount();
      });
    });
  });

  describe('Tab Skeleton Layouts', () => {
    it('renders HomeScreenSkeleton layout structure', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<HomeScreenSkeleton />);
      });
      expect(renderer!.root).toBeTruthy();
      act(() => {
        renderer.unmount();
      });
    });

    it('renders InsightsScreenSkeleton layout structure', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<InsightsScreenSkeleton />);
      });
      expect(renderer!.root).toBeTruthy();
      act(() => {
        renderer.unmount();
      });
    });

    it('renders TimelineScreenSkeleton layout structure', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<TimelineScreenSkeleton />);
      });
      expect(renderer!.root).toBeTruthy();
      act(() => {
        renderer.unmount();
      });
    });

    it('renders SummaryScreenSkeleton layout structure', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(<SummaryScreenSkeleton />);
      });
      expect(renderer!.root).toBeTruthy();
      act(() => {
        renderer.unmount();
      });
    });
  });
});

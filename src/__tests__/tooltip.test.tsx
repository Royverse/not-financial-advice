import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tooltip from '../components/ui/Tooltip';

describe('Tooltip', () => {
    it('renders children', () => {
        render(<Tooltip content="Test tooltip"><span>Hover me</span></Tooltip>);
        expect(screen.getByText('Hover me')).toBeDefined();
    });

    it('renders tooltip content', () => {
        render(<Tooltip content="My tooltip text"><button>btn</button></Tooltip>);
        expect(screen.getByText('My tooltip text')).toBeDefined();
    });

    it('defaults to top position (bottom-full class)', () => {
        const { container } = render(
            <Tooltip content="tip"><span>child</span></Tooltip>
        );
        const tooltipDiv = container.querySelector('.bottom-full');
        expect(tooltipDiv).not.toBeNull();
    });

    it('uses top-full class when position is bottom', () => {
        const { container } = render(
            <Tooltip content="tip" position="bottom"><span>child</span></Tooltip>
        );
        const tooltipDiv = container.querySelector('.top-full');
        expect(tooltipDiv).not.toBeNull();
    });

    it('does not use top-full for top position', () => {
        const { container } = render(
            <Tooltip content="tip" position="top"><span>child</span></Tooltip>
        );
        // top position should use bottom-full, not top-full for the tooltip box
        const tooltipBox = container.querySelector('.bottom-full');
        expect(tooltipBox).not.toBeNull();
    });

    it('applies mt-2 spacing for bottom position', () => {
        const { container } = render(
            <Tooltip content="tip" position="bottom"><span>child</span></Tooltip>
        );
        expect(container.querySelector('.mt-2')).not.toBeNull();
    });

    it('applies mb-2 spacing for top position', () => {
        const { container } = render(
            <Tooltip content="tip" position="top"><span>child</span></Tooltip>
        );
        expect(container.querySelector('.mb-2')).not.toBeNull();
    });
});

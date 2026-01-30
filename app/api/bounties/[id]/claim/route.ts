import { NextResponse } from 'next/server';
import { BountyStore } from '@/lib/store';
import { addDays } from 'date-fns';
import { getCurrentUser } from '@/lib/server-auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: bountyId } = await params;

    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { contributorId } = body;

        // If client sends contributorId, ensure it matches the authenticated user
        if (contributorId && contributorId !== user.id) {
            return NextResponse.json({ error: 'Contributor ID mismatch' }, { status: 403 });
        }

        const bounty = BountyStore.getBountyById(bountyId);
        if (!bounty) {
            return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
        }

        if (bounty.claimingModel !== 'single-claim') {
            return NextResponse.json({ error: 'Invalid claiming model for this action' }, { status: 400 });
        }

        if (bounty.status !== 'open') {
            return NextResponse.json({ error: 'Bounty is not available' }, { status: 409 });
        }

        const now = new Date();
        const updates = {
            status: 'claimed' as const,
            claimedBy: user.id, // Use authenticated user ID
            claimedAt: now.toISOString(),
            claimExpiresAt: addDays(now, 7).toISOString(),
            updatedAt: now.toISOString()
        };

        const updatedBounty = BountyStore.updateBounty(bountyId, updates);

        if (!updatedBounty) {
            return NextResponse.json({ success: false, error: 'Failed to update bounty' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: updatedBounty });

    } catch (error) {
        console.error('Error claiming bounty:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

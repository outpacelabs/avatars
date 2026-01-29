import { GradientAvatar } from "@/components/GradientAvatar";

export default function TestGradientsPage() {
	// Generate 50 fake session IDs that will hash to indices 0-49
	const gradients = Array.from({ length: 50 }, (_, i) => ({
		id: `test-session-${i}`,
		index: i,
	}));

	return (
		<div className="min-h-screen bg-gray-950 p-8">
			<h1 className="text-2xl font-bold text-white mb-2">Gradient Avatars</h1>
			<p className="text-gray-400 mb-8">
				50 pre-generated mesh gradient avatars
			</p>

			<div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4">
				{gradients.map(({ index }) => (
					<div key={index} className="flex flex-col items-center gap-2">
						<img
							src={`/avatars/gradient-${index}.webp`}
							alt={`Gradient ${index}`}
							className="w-16 h-16 rounded-full border border-black"
						/>
						<span className="text-xs text-gray-500">{index}</span>
					</div>
				))}
			</div>

			<h2 className="text-xl font-bold text-white mt-12 mb-4">Size Variants</h2>
			<div className="flex items-end gap-4">
				{[24, 32, 48, 64, 96].map((size) => (
					<div key={size} className="flex flex-col items-center gap-2">
						<GradientAvatar sessionId="demo-user" size={size} />
						<span className="text-xs text-gray-500">{size}px</span>
					</div>
				))}
			</div>

			<h2 className="text-xl font-bold text-white mt-12 mb-4">
				Stacked Preview
			</h2>
			<div className="flex items-center gap-1">
				<div className="flex items-center isolate pr-3">
					{[0, 1, 2, 3, 4].map((i) => (
						<img
							key={i}
							src={`/avatars/gradient-${i * 10}.webp`}
							alt={`Gradient ${i * 10}`}
							className="w-7 h-7 rounded-full border border-black"
							style={{ marginRight: -12, zIndex: 5 - i }}
						/>
					))}
				</div>
				<span className="text-[10px] font-medium leading-[14px] text-white/70 tracking-[0.1px]">
					+45
				</span>
			</div>
		</div>
	);
}

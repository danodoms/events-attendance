"use client";

import { useQuery } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SelectFilter from "@/components/SelectFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	type Event,
	deactivateEvent,
	type eventDuration,
	getEvents,
} from "@/models/Event";
import { format, getMonth, getYear, parseISO } from "date-fns";
import {
	Calendar,
	Clock,
	Ellipsis,
	Filter,
	MapPin,
	Plus,
	Trash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import EventFormDialog from "./EventFormDialog";

export default function EventsPage() {
	const {
		data: events = [],
		error,
		isLoading,
	} = useQuery<Event[]>({
		queryKey: ["events"],
		queryFn: getEvents,
	});

	const [statusFilter, setStatusFilter] = useState<"active" | "inactive">(
		"active",
	);
	const [filter, setFilter] = useState<string>("");
	const [durationFilter, setDurationFilter] = useState<eventDuration | "all">(
		"all",
	);
	const [monthFilter, setMonthFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");

	const formatDate = (dateString: string): string =>
		format(parseISO(dateString), "MMMM d, yyyy");

	const renderEventDuration = (duration: Event["duration"]): string => {
		switch (duration) {
			case "AM_ONLY":
				return "Morning";
			case "PM_ONLY":
				return "Afternoon";
			case "AM_AND_PM":
				return "Whole Day";
			default:
				return "Unknown";
		}
	};

	const convertDuration = (duration: string): eventDuration | undefined => {
		if (duration.toLowerCase() == "morning") {
			return "AM_ONLY";
		} else if (duration.toLowerCase() == "afternoon") {
			return "PM_ONLY";
		} else if (duration.toLowerCase() == "whole day") {
			return "AM_AND_PM";
		}
	};

	const uniqueMonths = Array.from(
		new Set(events.map((event) => getMonth(parseISO(event.date)))),
	);
	const uniqueYears = Array.from(
		new Set(events.map((event) => getYear(parseISO(event.date)))),
	);

	const sortEventsByDate = (events: Event[]): Event[] => {
		return events.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	};

	const filteredEvents = sortEventsByDate(
		events.filter((event) => {
			const eventDate = parseISO(event.date);
			return (
				event.name.toLowerCase().includes(filter.toLowerCase()) &&
				(statusFilter == "active" ? event.is_active : !event.is_active) &&
				(durationFilter !== "all"
					? event.duration === convertDuration(durationFilter)
					: true) &&
				(monthFilter !== "all"
					? format(eventDate, "MMMM") === monthFilter
					: true) &&
				(yearFilter !== "all"
					? getYear(eventDate) === Number(yearFilter)
					: true)
			);
		}),
	);

	const resetFilters = () => {
		setStatusFilter("active");
		setFilter("");
		setDurationFilter("all");
		setMonthFilter("all");
		setYearFilter("all");
	};

	const countActiveFilters = () => {
		let count = 0;
		if (statusFilter !== "active") count++;
		if (durationFilter !== "all") count++;
		if (monthFilter !== "all") count++;
		if (yearFilter !== "all") count++;
		return count;
	};

	const convertMonthsToNames = (months: number[]): string[] =>
		months.map((month) => format(new Date(2021, month, 1), "MMMM"));

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 items-center">
				<h1 className="text-2xl font-bold tracking-tight mr-auto">Events</h1>
				<Link href="/events/create">
					<Button variant={"ghost"}>
						<Plus className="size-4" />
						Add
					</Button>
				</Link>
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline">
							<Filter className="mr-2 size-4" />
							Filter
							{countActiveFilters() > 0 && (
								<Badge variant={"destructive"} className="ml-2">
									{countActiveFilters()}
								</Badge>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent className="flex h-full justify-center flex-col">
						<SheetHeader>
							<SheetTitle>Filter Events</SheetTitle>
							<SheetDescription className="text-balance">
								Select filters to apply
							</SheetDescription>
						</SheetHeader>
						<div className="flex gap-1 flex-col justify-evenly py-4">
							<p className="text-xs opacity-50">Status</p>
							<SelectFilter
								label="Status"
								items={["Inactive"]}
								value={statusFilter}
								setValue={setStatusFilter}
								defaultValue={{ label: "Active", value: "active" }}
							/>

							<p className="text-xs opacity-50 mt-2">Year</p>
							<SelectFilter
								label="Year"
								items={uniqueYears}
								value={yearFilter}
								setValue={setYearFilter}
								defaultValue={{ label: "All Years", value: "all" }}
							/>

							<p className="text-xs mt-2 opacity-50">Month</p>
							<SelectFilter
								label="Month"
								items={convertMonthsToNames(uniqueMonths)}
								value={monthFilter}
								setValue={setMonthFilter}
								defaultValue={{ label: "All Months", value: "all" }}
							/>

							<p className="text-xs opacity-50 mt-2">Duration</p>
							<SelectFilter
								label="Duration"
								items={["Morning", "Afternoon", "Whole day"]}
								value={durationFilter}
								setValue={setDurationFilter}
								defaultValue={{ label: "All Durations", value: "all" }}
							/>
						</div>
						<SheetFooter className="flex gap-2 flex-col">
							<SheetClose asChild>
								<Button type="submit" className="w-full mx-auto">
									Apply Filters
								</Button>
							</SheetClose>
							<Button
								className="mt-20 w-full"
								onClick={resetFilters}
								variant={"ghost"}
							>
								Reset Filters
							</Button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			</div>
			{filteredEvents.length ? (
				<div className="flex flex-col gap-3 md:grid grid-cols-2 overflow-y-auto max-h-screen rounded-md">
					{filteredEvents.map((event, index) => (
						<div
							key={index}
							className="p-4 border rounded-lg flex flex-col gap-2 backdrop-contrast-50 backdrop-opacity-25"
						>
							<div className="flex justify-between items-center">
								<div className="flex gap-2 items-center">
									<Calendar className="size-5" />
									<p className="font-bold text-sm">{formatDate(event.date)}</p>
								</div>
								<div className="flex gap-2 items-center">
									<DropdownMenu>
										<DropdownMenuTrigger className=" rounded-full text-sm flex gap-2 items-center">
											<Ellipsis className=" " />
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuLabel>Actions</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem asChild>
												<EventFormDialog event={event} />
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => deactivateEvent(event)}>
												<Trash className="size-4 mr-2" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
							<Separator className="my-1" />
							<h2 className="font-bold text-xl">{event.name}</h2>
							<div className="text-xs text-balance truncate">
								{event.description || "No description"}
							</div>
							<div className="flex gap-2 flex-wrap mt-1">
								<Badge className="flex gap-1">
									<Clock className="size-3" />
									{renderEventDuration(event.duration)}
								</Badge>
								{event.location && (
									<Badge className="flex gap-1">
										<MapPin className="size-3" />
										{event.location}
									</Badge>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col mx-auto gap-4 p-20 opacity-50">
					<p>No events</p>
				</div>
			)}
			<ToastContainer />
		</div>
	);
}

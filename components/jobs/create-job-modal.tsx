"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  createJobAction,
  type CreateJobInput,
} from "@/app/actions/jobs";
import type { ServiceType } from "@/types/service";

type CreateJobModalProps = {
  serviceTypes: ServiceType[];
  onClose: () => void;
  onJobCreated: () => Promise<void>;
};

export default function CreateJobModal({
  serviceTypes,
  onClose,
  onJobCreated,
}: CreateJobModalProps) {
  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [vehicleYear, setVehicleYear] =
    useState("");

  const [vehicleMake, setVehicleMake] =
    useState("");

  const [vehicleModel, setVehicleModel] =
    useState("");

  const [licensePlate, setLicensePlate] =
    useState("");

  const [
    selectedServiceIds,
    setSelectedServiceIds,
  ] = useState<string[]>([]);

  const [priority, setPriority] =
    useState(0);

  const [notes, setNotes] =
    useState("");

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const estimatedMinutes = useMemo(
    () =>
      serviceTypes
        .filter((service) =>
          selectedServiceIds.includes(
            service.id,
          ),
        )
        .reduce(
          (total, service) =>
            total +
            service.estimated_minutes,
          0,
        ),
    [
      selectedServiceIds,
      serviceTypes,
    ],
  );

  function toggleService(
    serviceId: string,
  ) {
    setSelectedServiceIds(
      (current) =>
        current.includes(serviceId)
          ? current.filter(
              (id) =>
                id !== serviceId,
            )
          : [...current, serviceId],
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);

    if (!customerName.trim()) {
      setMessage(
        "Customer name is required.",
      );
      return;
    }

    if (
      selectedServiceIds.length === 0
    ) {
      setMessage(
        "Select at least one service.",
      );
      return;
    }

    const parsedVehicleYear =
      vehicleYear.trim()
        ? Number(vehicleYear)
        : null;

    if (
      parsedVehicleYear !== null &&
      (!Number.isInteger(
        parsedVehicleYear,
      ) ||
        parsedVehicleYear < 1900 ||
        parsedVehicleYear >
          new Date().getFullYear() + 1)
    ) {
      setMessage(
        "Enter a valid vehicle year.",
      );
      return;
    }

    const input: CreateJobInput = {
      customerName,
      customerPhone:
        customerPhone || null,

      vehicleYear:
        parsedVehicleYear,

      vehicleMake:
        vehicleMake || null,

      vehicleModel:
        vehicleModel || null,

      licensePlate:
        licensePlate || null,

      serviceTypeIds:
        selectedServiceIds,

      priority,

      notes:
        notes || null,
    };

    setIsSubmitting(true);

    try {
      const result =
        await createJobAction(input);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      await onJobCreated();
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The job could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close new job"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[95vh] overflow-y-auto rounded-t-2xl bg-slate-100 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-2xl sm:rounded-none">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Queue
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                New Job
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Add a customer vehicle
                to today&apos;s queue.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-5"
        >
          {message && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {message}
            </div>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              Customer
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customer-name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Customer Name *
                </label>

                <input
                  id="customer-name"
                  type="text"
                  required
                  value={
                    customerName
                  }
                  onChange={(
                    event,
                  ) =>
                    setCustomerName(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  value={
                    customerPhone
                  }
                  onChange={(
                    event,
                  ) =>
                    setCustomerPhone(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              Vehicle
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="vehicle-year"
                  className="text-sm font-semibold text-slate-700"
                >
                  Year
                </label>

                <input
                  id="vehicle-year"
                  type="number"
                  inputMode="numeric"
                  min="1900"
                  max={
                    new Date().getFullYear() +
                    1
                  }
                  value={vehicleYear}
                  onChange={(
                    event,
                  ) =>
                    setVehicleYear(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="license-plate"
                  className="text-sm font-semibold text-slate-700"
                >
                  License Plate
                </label>

                <input
                  id="license-plate"
                  type="text"
                  value={licensePlate}
                  onChange={(
                    event,
                  ) =>
                    setLicensePlate(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 uppercase text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="vehicle-make"
                  className="text-sm font-semibold text-slate-700"
                >
                  Make
                </label>

                <input
                  id="vehicle-make"
                  type="text"
                  value={vehicleMake}
                  onChange={(
                    event,
                  ) =>
                    setVehicleMake(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Toyota"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="vehicle-model"
                  className="text-sm font-semibold text-slate-700"
                >
                  Model
                </label>

                <input
                  id="vehicle-model"
                  type="text"
                  value={vehicleModel}
                  onChange={(
                    event,
                  ) =>
                    setVehicleModel(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Tacoma"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Services
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Select everything
                  this vehicle needs.
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estimated
                </p>

                <p className="font-bold text-slate-900">
                  {
                    estimatedMinutes
                  }{" "}
                  min
                </p>
              </div>
            </div>

            {serviceTypes.length ===
            0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No active services
                are available.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {serviceTypes.map(
                  (service) => {
                    const selected =
                      selectedServiceIds.includes(
                        service.id,
                      );

                    return (
                      <label
                        key={
                          service.id
                        }
                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 ${
                          selected
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleService(
                                service.id,
                              )
                            }
                            className="h-4 w-4"
                          />

                          <span className="font-medium text-slate-800">
                            {
                              service.name
                            }
                          </span>
                        </div>

                        <span className="shrink-0 text-sm text-slate-500">
                          {
                            service.estimated_minutes
                          }{" "}
                          min
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              Additional Details
            </h3>

            <div className="mt-4">
              <label
                htmlFor="priority"
                className="text-sm font-semibold text-slate-700"
              >
                Priority
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
              >
                <option value={0}>
                  Normal
                </option>

                <option value={10}>
                  High
                </option>
              </select>
            </div>

            <div className="mt-4">
              <label
                htmlFor="notes"
                className="text-sm font-semibold text-slate-700"
              >
                Notes
              </label>

              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          </section>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-100 py-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                serviceTypes.length ===
                  0
              }
              className="rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating..."
                : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
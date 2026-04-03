"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  getStoresForRegion,
  getSmsForStores,
  createStore,
  createSm,
  getRegion,
} from "@/app/actions/admin";

type Store = { id: string; name: string; address: string | null };
type SmWithStore = {
  sm: { id: string; name: string; email: string; storeId: string };
  storeName: string;
};
type Region = { id: string; name: string; country: string };

export function AdminModal({ regionId }: { regionId: string }) {
  const [open, setOpen] = useState(false);
  const [regionData, setRegionData] = useState<Region | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [sms, setSms] = useState<SmWithStore[]>([]);
  const [isPending, startTransition] = useTransition();

  // New store form
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");

  // New SM form
  const [newSmName, setNewSmName] = useState("");
  const [newSmEmail, setNewSmEmail] = useState("");
  const [newSmPassword, setNewSmPassword] = useState("");
  const [newSmStore, setNewSmStore] = useState("");

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  async function loadData() {
    const [r, storeList] = await Promise.all([
      getRegion(regionId),
      getStoresForRegion(regionId),
    ]);
    setRegionData(r as Region);
    setStores(storeList as Store[]);

    const storeIds = storeList.map((s) => s.id);
    const smList = await getSmsForStores(storeIds);
    setSms(smList as SmWithStore[]);
  }

  function handleCreateStore() {
    if (!newStoreName.trim()) return;
    startTransition(async () => {
      await createStore({
        name: newStoreName.trim(),
        address: newStoreAddress.trim(),
        regionId,
      });
      setNewStoreName("");
      setNewStoreAddress("");
      await loadData();
    });
  }

  function handleCreateSm() {
    if (!newSmName.trim() || !newSmEmail.trim() || !newSmPassword || !newSmStore)
      return;
    startTransition(async () => {
      await createSm({
        name: newSmName.trim(),
        email: newSmEmail.trim(),
        storeId: newSmStore,
        password: newSmPassword,
      });
      setNewSmName("");
      setNewSmEmail("");
      setNewSmPassword("");
      setNewSmStore("");
      await loadData();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="h-9 font-medium" />}
      >
        Admin
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin</DialogTitle>
          {regionData && (
            <p className="text-sm text-muted-foreground">
              {regionData.name}, {regionData.country}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Stores */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Stores ({stores.length})
            </Label>
            <div className="mt-2 space-y-2">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <p className="text-sm font-medium flex-1">{s.name}</p>
                  {s.address && (
                    <p className="text-xs text-muted-foreground truncate max-w-48">
                      {s.address}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <Input
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Store name"
                className="h-9 text-sm"
              />
              <Input
                value={newStoreAddress}
                onChange={(e) => setNewStoreAddress(e.target.value)}
                placeholder="Address"
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                onClick={handleCreateStore}
                disabled={isPending || !newStoreName.trim()}
                className="h-9 shrink-0"
              >
                Add Store
              </Button>
            </div>
          </div>

          <Separator />

          {/* Store Managers */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Store Managers ({sms.length})
            </Label>
            <div className="mt-2 space-y-2">
              {sms.map((s) => (
                <div
                  key={s.sm.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <p className="text-sm font-medium flex-1">{s.sm.name}</p>
                  <p className="text-xs text-muted-foreground">{s.sm.email}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.storeName}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Input
                value={newSmName}
                onChange={(e) => setNewSmName(e.target.value)}
                placeholder="Name"
                className="h-9 text-sm"
              />
              <Input
                value={newSmEmail}
                onChange={(e) => setNewSmEmail(e.target.value)}
                placeholder="Email"
                className="h-9 text-sm"
              />
              <Input
                value={newSmPassword}
                onChange={(e) => setNewSmPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="h-9 text-sm"
              />
              <select
                value={newSmStore}
                onChange={(e) => setNewSmStore(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select store...</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={handleCreateSm}
              disabled={
                isPending ||
                !newSmName.trim() ||
                !newSmEmail.trim() ||
                !newSmPassword ||
                !newSmStore
              }
              className="h-9 mt-2"
            >
              Add Store Manager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
